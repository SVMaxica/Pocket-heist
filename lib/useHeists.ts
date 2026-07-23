"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "@/lib/useAuthState";
import { COLLECTIONS, heistConverter, type Heist } from "@/types/firestore";

export type HeistsMode = "active" | "assigned" | "expired";

export type HeistsState =
  | { status: "loading"; heists: null; error: null }
  | { status: "ready"; heists: Heist[]; error: null }
  | { status: "error"; heists: null; error: Error };

const LOADING: HeistsState = { status: "loading", heists: null, error: null };

// Snapshot-resultatet taggas med den prenumeration (mode+uid) det hör till, så
// att gammal data från ett tidigare läge inte visas medan en ny prenumeration
// ännu inte hunnit leverera sitt första snapshot.
type Snapshot =
  | { key: string; status: "ready"; heists: Heist[] }
  | { key: string; status: "error"; error: Error };

export function useHeists(mode: HeistsMode): HeistsState {
  const { status: authStatus, user } = useAuthState();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const uid = user?.uid;
  // Bygg bara en query när vi vet vem användaren är (active/assigned filtrerar
  // på uid). key är null tills dess, och hooken rapporterar "loading".
  const key = authStatus === "authenticated" && uid ? `${mode}:${uid}` : null;

  useEffect(() => {
    if (!key || !uid) return;

    const heistsRef = collection(db, COLLECTIONS.HEISTS).withConverter(
      heistConverter,
    );

    // `expired` gäller alla användares heists, så det läget använder inget
    // filter alls. active/assigned filtrerar på uid.
    const heistsQuery =
      mode === "active"
        ? query(heistsRef, where("assignedTo", "==", uid))
        : mode === "assigned"
          ? query(heistsRef, where("createdBy", "==", uid))
          : heistsRef;

    const unsubscribe = onSnapshot(
      heistsQuery,
      (querySnapshot) => {
        // Deadline-jämförelsen görs klientsidigt (ingen orderBy/olikhetsfilter i
        // queryn, så inget sammansatt index krävs). Notera: en heist byter inte
        // sektion enbart för att klockan passerar dess deadline — det sker först
        // vid nästa Firestore-skrivning som levererar ett nytt snapshot.
        const now = Date.now();
        const heists = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((heist) =>
            mode === "expired"
              ? heist.deadline.getTime() <= now
              : heist.deadline.getTime() > now,
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setSnapshot({ key, status: "ready", heists });
      },
      (error) => {
        setSnapshot({ key, status: "error", error });
      },
    );

    return unsubscribe;
  }, [key, mode, uid]);

  // Härled returvärdet under render: har vi inget snapshot för den aktuella
  // prenumerationen ännu, är vi i laddningsläge.
  if (!key || snapshot === null || snapshot.key !== key) {
    return LOADING;
  }
  if (snapshot.status === "error") {
    return { status: "error", heists: null, error: snapshot.error };
  }
  return { status: "ready", heists: snapshot.heists, error: null };
}
