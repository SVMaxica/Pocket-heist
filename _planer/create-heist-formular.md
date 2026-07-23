# Kodnamn vid signup + createdAt på heists + Create Heist-formulär

## Kontext

`_specs/create-heist-formular.md` beskriver att `/heists/create` (idag bara en platshållarrubrik) ska bli ett fungerande formulär som skapar ett heist-dokument i Firestore och tilldelar det till en kollega, vald via kodnamn. Under specens öppna frågor framkom att **ingen `users`-collection eller kodnamn-koncept finns i kodbasen alls** — `AuthForm` skapar idag bara ett Firebase Auth-konto (e-post/lösenord), inget kodnamn samlas in och inget Firestore-dokument skrivs. Det är därför en förutsättning för create-heist-formuläret, inte en separat feature.

Beslut som klargjorts med användaren:
- Kodnamn väljs av användaren själv vid signup, med några klickbara förslag (spion-tema, t.ex. `@ShadowOwl`).
- Kodnamn måste vara globalt unika — tydligt felmeddelande om upptaget.
- `user id` = Firebase Auths auto-genererade `uid` (inget separat ID behövs); `users`-collection nyckelas på `uid`.
- Självtilldelning av heists är **inte** tillåtet — den inloggade användaren exkluderas ur listan över tilldelningsbara personer.
- `types/firestore/heist.ts` saknar `createdAt` (bara `deadline` finns) — ska läggas till, satt automatiskt precis som `deadline`.

Följer den etablerade `firestore-schemas`-skillen (`.claude/skills/firestore-schemas/SKILL.md`) och komponentkonventionen (`components/<Namn>/<Namn>.tsx` + `.module.css` + `index.ts`, `"use client"` bara vid behov, sidor som tunna wrappers — se `app/(public)/login/page.tsx` → `AuthForm`).

## 1. Firestore-scheman

**`types/firestore/user.ts`** (ny fil, samma mönster som `heist.ts`):
```ts
export interface User { id: string; codename: string; createdAt: Date; }
export interface CreateUserInput { codename: string; createdAt: Timestamp; }
export function buildCreateUserInput(codename: string, now = new Date()): CreateUserInput
export const userConverter = { toFirestore: identity, fromFirestore: ... }
```
Inget `UpdateUserInput` ännu (inget i scope uppdaterar en profil). `id` == Firebase Auth-`uid`, dokumentet skapas på `users/{uid}`.

**`types/firestore/index.ts`**: lägg till `export * from "./user";` och `COLLECTIONS.USERS = "users"`.

**`types/firestore/heist.ts`**: lägg till `createdAt` överallt `deadline` redan hanteras:
- `Heist.createdAt: Date`, `CreateHeistInput.createdAt: Timestamp` (inte i `UpdateHeistInput`, matchar skillens "no createdAt i Update Input").
- `buildCreateHeistInput`: byt `Omit<CreateHeistInput, 'deadline' | 'finalStatus'>` → lägg till `| 'createdAt'`, sätt `createdAt: Timestamp.fromDate(now)` i returen.
- `heistConverter.fromFirestore`: lägg till `createdAt: snapshot.data().createdAt?.toDate()`.

**Ingen dedikerad typ för `codenames`-reservationscollectionen** (se nedan) — den läses aldrig tillbaka som en domänmodell, bara skapas/kollas i en transaktion, så en fullständig `Codename`/converter-trio vore överbyggnad.

## 2. Kodnamn-unikhet: `lib/codenames.ts` (ny fil — kärnlogiken)

Verifierat mot aktuell Firestore-dokumentation (`runTransaction` kräver att alla `.get()` sker innan några `.set()`/`.update()`, annars kastar SDK:t ett fel):

```ts
export class CodenameTakenError extends Error { ... }
export function normalizeCodename(codename: string): string // trim().toLowerCase()

export async function claimCodenameAndCreateUser(uid: string, codename: string, now = new Date()): Promise<void> {
  const trimmed = codename.trim();
  const normalized = normalizeCodename(trimmed);
  const codenameRef = doc(db, "codenames", normalized);
  const userRef = doc(db, COLLECTIONS.USERS, uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(codenameRef);       // läsning FÖRST
    if (snap.exists()) throw new CodenameTakenError(trimmed);
    const createdAt = Timestamp.fromDate(now);
    transaction.set(codenameRef, { uid, codename: trimmed, createdAt });  // skrivningar EFTER
    transaction.set(userRef, { codename: trimmed, createdAt });
  });
}
```

- **Unikhetsgaranti**: `codenames/{normaliserat-kodnamn}` fungerar som ett reservations-lås — Firestore transaktioner har optimistisk concurrency-kontroll med automatisk retry, så om två signups race:ar om samma kodnamn kommer förloraren vid retry läsa att dokumentet nu finns och kasta `CodenameTakenError`. En vanlig "läs sen skriv"-kontroll (utan transaktion) skulle INTE ge den garantin.
- **Normalisering**: `trim().toLowerCase()` används enbart som dokument-ID för unikhetskontrollen (case-insensitive). Originalcasing (`trimmed`) sparas i `users/{uid}.codename` och dupliceras i `codenames/{normaliserat}.codename` för felsökning.
- **Firestore-regler**: inga ändringar behövs — `firestore.rules`s befintliga `allow read, write: if request.auth != null;` matchar `{document=**}` och täcker `users`/`codenames` automatiskt.

## 3. Kodnamnsförslag: `lib/codenameSuggestions.ts` (ny fil, ren funktion)

```ts
export function generateCodenameSuggestions(count = 4, random: () => number = Math.random): string[]
```
Kombinerar två ordlistor (adjektiv: Night/Shadow/Midnight/Phantom/Stealthy/Ghost/Dark/Silent... + substantiv: Owl/Panda/Coder/Boss/Agent/Runner/Knight...) till `@AdjektivSubstantiv`-förslag utan dubbletter. Tar en injicerbar `random`-parameter (matchar `buildCreateHeistInput`s injicerbara `now`) så testerna blir deterministiska utan att mocka `Math.random` globalt. Ingen Firestore-koppling — krockar en chip mot ett redan taget kodnamn hanteras av samma felväg som vid manuell inmatning.

## 4. `components/AuthForm/AuthForm.tsx` — kodnamnsfält + rollback

**Nytt state**: `codename`, `errors.codename`, `suggestions` (lazy `useState(() => generateCodenameSuggestions())`).

**Rendering**: kodnamnsfält + klickbara förslags-chips visas **bara när `mode === "signup"`** (mellan lösenord och submit-knappen), så befintliga login-lägestester inte påverkas. `handleToggleMode` nollställer även `codename` (som redan görs för `email`/`password`).

**Submit-flödet** (ny ordning för signup-läget):
```ts
if (mode === "signup") {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await claimCodenameAndCreateUser(credential.user.uid, codename);
  } catch (err) {
    await deleteUser(credential.user);   // rulla tillbaka det oanvändbara auth-kontot
    setErrors(err instanceof CodenameTakenError
      ? { codename: "That codename is already taken" }
      : { form: "Could not create account. Please try again." });
    setIsSubmitting(false);
    return;
  }
} else {
  await signInWithEmailAndPassword(auth, email, password);
}
router.push("/heists");
```
Verifierat mot Firebase-dokumentationen: `deleteUser(user)` är korrekt/säkert direkt efter en lyckad `createUserWithEmailAndPassword` — `credential.user` är då nyinloggad så `auth/requires-recent-login` (som annars kan krävas för känsliga kontoändringar) blir inte ett problem. Om `deleteUser` själv misslyckas (t.ex. nätverksfel) blir kontot kvar utan profil — accepterad, odokumenterad edge case för denna omfattning (skulle kräva en admin-cleanup-process för att lösas helt).

## 5. `components/CreateHeistForm/` (ny komponent) + sidwrapper

Inga props — läser egen auth-status via `useAuthState()` (redan garanterat autentiserad av `RouteGuard` i `(dashboard)/layout.tsx`, men behöver `user.uid`).

**Hämtar tilldelningsbara användare** (`useEffect` vid mount): `getDocs(collection(db, COLLECTIONS.USERS).withConverter(userConverter))` — hämtar **hela** `users`-collectionen. Härleder:
- `assignableUsers = users.filter(u => u.id !== currentUid)` (självtilldelning blockerad).
- `myCodename = users.find(u => u.id === currentUid)?.codename` — återanvänder samma läsning istället för ett extra Firestore-anrop.

**Renderingslägen**: laddar (`<Loader />`), hämtningsfel (felmeddelande), tom lista efter exkludering av sig själv (**edge case**: visa "There's no one else to assign a heist to yet" istället för en trasig tom `<select>`, blockera submit) — annars ett vanligt `<select>` med kodnamn som text och `uid` som value.

**Submit**: validerar titel/beskrivning/tilldelning (icke-tomma), bygger input via `buildCreateHeistInput({ title, description, createdBy: uid, createdByCodename: myCodename, assignedTo, assignedToCodename })`, skriver med `addDoc(collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter), input)`, redirectar till `/heists` via `router.push`. Vid fel: felmeddelande, formulärdata kvar (inget clear). `disabled={isSubmitting}` på submit-knappen skyddar mot dubbelklick.

`app/(dashboard)/heists/create/page.tsx` blir en tunn wrapper runt `<CreateHeistForm />`, samma mönster som `/login`.

## 6. Tester

- `tests/types/firestore/heist.test.ts` (uppdatera): `createdAt` sätts korrekt av `buildCreateHeistInput`, konverteras korrekt i `fromFirestore`.
- `tests/types/firestore/user.test.ts` (ny): motsvarande för `buildCreateUserInput`/`userConverter`.
- `tests/lib/codenameSuggestions.test.ts` (ny, ingen mockning): rätt antal, rätt format, inga dubbletter, deterministisk med injicerad `random`.
- `tests/lib/codenames.test.ts` (ny): mocka `firebase/firestore`s `doc`/`runTransaction` (samma `(...args) => mockFn(...args)`-stil som övriga tester). Scenarier: kodnamn ledigt → båda `set`-anropen sker med normaliserat/original-casing korrekt; kodnamn taget → kastar `CodenameTakenError`, inga skrivningar; normalisering (`"  NightOwl  "` → doc-id `"nightowl"`, sparat `codename` = `"NightOwl"`).
- `tests/components/AuthForm.test.tsx` (utöka, inte ersätt): mocka `deleteUser` och `@/lib/codenames`. Nya scenarier: kodnamnsfält+chips syns bara i signup-läge, chip-klick fyller fältet, tomt kodnamn valideras, lyckad signup anropar `claimCodenameAndCreateUser` sedan `router.push`, kodnamn-taget-scenario anropar `deleteUser` + visar fel + `router.push` anropas INTE, lägesväxling rensar kodnamnsfältet.
- `tests/components/CreateHeistForm.test.tsx` (ny): mocka `@/lib/useAuthState`, `firebase/firestore` (`collection`/`getDocs`/`addDoc`), `next/navigation`. Scenarier: laddningsläge, rendering av fält + tilldelningslista (exkluderar inloggad användare), tom-lista-läge, hämtningsfel, lyckad inskickning (rätt payload inkl. `createdAt`/`deadline`/`finalStatus: null`, redirect), misslyckad inskickning (fel visas, data kvar), dubbelklicksskydd.

## Verifiering

1. `npx vitest run`, `npm run lint`, `npx tsc --noEmit` — alla rena.
2. `npm run dev` + manuellt i webbläsaren och Firebase-konsolen:
   - `/signup`: kodnamnsfält + ~4 förslags-chips syns (bara i signup-läge). Klicka en chip, redigera, skicka in → redirect till `/heists`. Kontrollera i Firestore-konsolen att `users/{uid}` och `codenames/{normaliserat}` skapats korrekt.
   - Registrera en ny e-post med **samma kodnamn** (annan casing) → felmeddelande om upptaget kodnamn, och kontrollera i Authentication-konsolen att inget kvarlämnat konto skapades (bekräftar rollback).
   - `/heists/create` inloggad: tilldelningslistan visar den andra användarens kodnamn, inte din egen. Skicka in → redirect till `/heists`, kontrollera i Firestore att `heists/{id}` fått rätt `createdBy(Codename)`/`assignedTo(Codename)`, `createdAt` (nu) och `deadline` (~48h senare), `finalStatus: null`.
   - Med bara en användare i systemet: bekräfta "no one else to assign"-meddelandet och att submit är blockerad.
