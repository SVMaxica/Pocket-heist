import { Timestamp, doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/firestore";

const CODENAMES_COLLECTION = "codenames";

export class CodenameTakenError extends Error {
  constructor(codename: string) {
    super(`Codename "${codename}" is already taken`);
    this.name = "CodenameTakenError";
  }
}

/** Normaliserar ett kodnamn för unikhetskontroll (case-insensitive dokument-id). */
export function normalizeCodename(codename: string): string {
  return codename.trim().toLowerCase();
}

/**
 * Förhandskontroll (inte den auktoritativa unikhetsgarantin — den sker i
 * `claimCodenameAndCreateUser`s transaktion). Används för att undvika att
 * skapa ett Firebase Auth-konto i onödan när kodnamnet uppenbart redan är
 * upptaget, eftersom en lyckad kontoskapelse omedelbart gör användaren
 * inloggad och triggar route-guards innan en eventuell rollback hinner ske.
 */
export async function isCodenameAvailable(codename: string): Promise<boolean> {
  const normalized = normalizeCodename(codename);
  const codenameSnap = await getDoc(doc(db, CODENAMES_COLLECTION, normalized));
  return !codenameSnap.exists();
}

/**
 * Reserverar `codename` åt `uid` och skapar användarens profildokument,
 * atomiskt. Kastar CodenameTakenError om det (normaliserade) kodnamnet
 * redan är reserverat av någon annan.
 */
export async function claimCodenameAndCreateUser(
  uid: string,
  codename: string,
  now: Date = new Date(),
): Promise<void> {
  const trimmed = codename.trim();
  const normalized = normalizeCodename(trimmed);

  const codenameRef = doc(db, CODENAMES_COLLECTION, normalized);
  const userRef = doc(db, COLLECTIONS.USERS, uid);

  await runTransaction(db, async (transaction) => {
    const codenameSnap = await transaction.get(codenameRef);
    if (codenameSnap.exists()) {
      throw new CodenameTakenError(trimmed);
    }

    const createdAt = Timestamp.fromDate(now);

    transaction.set(codenameRef, { uid, codename: trimmed, createdAt });
    transaction.set(userRef, { codename: trimmed, createdAt });
  });
}
