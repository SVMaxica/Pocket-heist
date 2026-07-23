import {
  Timestamp,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
  type WithFieldValue,
} from "firebase/firestore";

const DEADLINE_HOURS = 48;

export type HeistFinalStatus = "success" | "failure";

// Document — vad man läser från Firestore (efter konvertering)
export interface Heist {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByCodename: string;
  assignedTo: string;
  assignedToCodename: string;
  createdAt: Date;
  deadline: Date;
  finalStatus: HeistFinalStatus | null;
}

// Create Input — vad som skickas till addDoc (id sätts av Firestore)
export interface CreateHeistInput {
  title: string;
  description: string;
  createdBy: string;
  createdByCodename: string;
  assignedTo: string;
  assignedToCodename: string;
  createdAt: Timestamp; // automatically set to now.
  deadline: Timestamp; // automatically 48 hours from creation.
  finalStatus: null;
}

// Update Input — valfria fält för updateDoc
export interface UpdateHeistInput {
  title?: string;
  description?: string;
  assignedTo?: string;
  assignedToCodename?: string;
  deadline?: Timestamp | FieldValue;
  finalStatus?: HeistFinalStatus | null;
}

/** Bygger create-input: createdAt blir "now", deadline blir 48h från `now`, finalStatus null. */
export function buildCreateHeistInput(
  fields: Omit<CreateHeistInput, "createdAt" | "deadline" | "finalStatus">,
  now: Date = new Date(),
): CreateHeistInput {
  const deadline = new Date(now.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);
  return {
    ...fields,
    createdAt: Timestamp.fromDate(now),
    deadline: Timestamp.fromDate(deadline),
    finalStatus: null,
  };
}

// Konvertern används bara för läsningar (.withConverter för getDocs/getDoc).
// Skrivningar görs mot en oconverterad collection-referens — toFirestore
// gör ändå ingenting (Firestore hanterar Timestamp-fält direkt), och en
// bredare parametertyp här stör TypeScripts typinferens för läsningarna.
export const heistConverter = {
  toFirestore: (data: WithFieldValue<Heist>): DocumentData => data,

  fromFirestore: (snapshot: QueryDocumentSnapshot): Heist =>
    ({
      id: snapshot.id,
      ...snapshot.data(),
      createdAt: snapshot.data().createdAt?.toDate(),
      deadline: snapshot.data().deadline?.toDate(),
    }) as Heist,
};
