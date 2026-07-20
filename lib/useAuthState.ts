"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "error"; user: null; error: Error };

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState(
          user
            ? { status: "authenticated", user, error: null }
            : { status: "unauthenticated", user: null, error: null },
        );
      },
      (error) => {
        setState({ status: "error", user: null, error });
      },
    );

    return unsubscribe;
  }, []);

  return state;
}
