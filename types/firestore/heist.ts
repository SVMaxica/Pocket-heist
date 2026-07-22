import {
  Timestamp,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
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
  deadline: Timestamp;
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

/** Bygger create-input: deadline blir 48h från `now`, finalStatus null. */
export function buildCreateHeistInput(
  fields: Omit<CreateHeistInput, "deadline" | "finalStatus">,
  now: Date = new Date(),
): CreateHeistInput {
  const deadline = new Date(now.getTime() + DEADLINE_HOURS * 60 * 60 * 1000);
  return {
    ...fields,
    deadline: Timestamp.fromDate(deadline),
    finalStatus: null,
  };
}

export const heistConverter = {
  toFirestore: (
    data: Partial<Heist> | CreateHeistInput | UpdateHeistInput,
  ): DocumentData => data,

  fromFirestore: (snapshot: QueryDocumentSnapshot): Heist =>
    ({
      id: snapshot.id,
      ...snapshot.data(),
      deadline: snapshot.data().deadline?.toDate(),
    }) as Heist,
};
