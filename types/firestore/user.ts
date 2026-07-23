import {
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from "firebase/firestore";

// Document — vad man läser från Firestore (efter konvertering)
export interface User {
  id: string; // == Firebase Auth-uid, samma som dokument-id (users/{uid})
  codename: string;
  createdAt: Date;
}

// Create Input — vad som skickas till setDoc (id är dokumentvägen, inget fält)
export interface CreateUserInput {
  codename: string;
  createdAt: Timestamp; // automatically set to now.
}

/** Bygger create-input: createdAt blir "now". */
export function buildCreateUserInput(
  codename: string,
  now: Date = new Date(),
): CreateUserInput {
  return {
    codename,
    createdAt: Timestamp.fromDate(now),
  };
}

// Konvertern används bara för läsningar (.withConverter för getDocs/getDoc).
// Skrivningar görs mot en oconverterad collection-referens — toFirestore
// gör ändå ingenting (Firestore hanterar Timestamp-fält direkt), och en
// bredare parametertyp här stör TypeScripts typinferens för läsningarna.
export const userConverter = {
  toFirestore: (data: WithFieldValue<User>): DocumentData => data,

  fromFirestore: (snapshot: QueryDocumentSnapshot): User =>
    ({
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate(),
    }) as User,
};
