# useHeists-hook för realtidsdata

## Kontext

`_specs/use-heists-hook.md` beskriver en hook `useHeists(mode)` som ska hämta heist-data i realtid från Firestore, filtrerat efter `active`/`assigned`/`expired`, och användas på `/heists` (`app/(dashboard)/heists/page.tsx`) för att visa bara titlarna i respektive sektion. Sidan är idag tre statiska platshållar-`<div>`ar med bara en `<h2>` i varje.

Viktig klargörande från specens öppna frågor: en heist vars deadline passerat men vars `finalStatus` fortfarande är `null` ska **också** listas under "expired". Det innebär att den effektiva definitionen av `expired` bara är "deadline har passerat" — `finalStatus`-villkoret i den ursprungliga specen-texten är överspelat av det här klargörandet.

Övriga klargöranden: tom resultatmängd → text ("inga heists"), laddning → en spinner byggd på `Clock8`-ikonen (inte projektets generiska `LoaderCircle`-baserade `<Loader />`, som är till för andra sammanhang), fel → felmeddelande, sortering → nyast (`createdAt`) först.

Inget i kodbasen använder idag `onSnapshot`/`query`/`where`/`orderBy` — bara `addDoc`/`getDocs`/`getDoc`/`runTransaction` finns sedan tidigare. `firestore.indexes.json` är ett tomt skelett; inget arbetsflöde finns för att skapa/deploya sammansatta index. Verifierat mot Firestores dokumentation: kombinerar man en `where`-likhetsfilter med en `where`-olikhetsfilter på ett ANNAT fält, eller lägger till `orderBy` på ett fält som inte matchar olikhetsfiltret, krävs ett sammansatt index. Därför hålls varje Firestore-query i denna plan till **max ett enkelt filter**, och all datumjämförelse/sortering görs i JavaScript i callbacken — det undviker helt behovet av att skapa/deploya index för den här featuren.

## `lib/useHeists.ts` (ny fil)

Följer exakt samma diskriminerade union-mönster som `lib/useAuthState.ts`:

```ts
export type HeistsMode = "active" | "assigned" | "expired";

export type HeistsState =
  | { status: "loading"; heists: null; error: null }
  | { status: "ready"; heists: Heist[]; error: null }
  | { status: "error"; heists: null; error: Error };

export function useHeists(mode: HeistsMode): HeistsState
```

**Intern uppbyggnad**: läser `useAuthState()` för `user?.uid`. Så länge auth-statusen inte är `"authenticated"` (dvs. under `"loading"` eller `"unauthenticated"`) stannar hooken i `"loading"` — ingen query byggs utan ett känt uid. (`/heists` är redan skyddad av `RouteGuard mode="require-authenticated"`, så detta är ett defensivt fall snarare än ett normalt scenario.)

**Query per läge** (alla via `collection(db, COLLECTIONS.HEISTS).withConverter(heistConverter)` — samma etablerade läs-mönster som redan används i `CreateHeistForm.tsx`, ger `Heist`-objekt med `Date` direkt i callbacken):

- `active`: `query(heistsRef, where("assignedTo", "==", uid))`
- `assigned`: `query(heistsRef, where("createdBy", "==", uid))`
- `expired`: **inget filter alls** — hela collectionen (`heistsRef` direkt till `onSnapshot`). Det matchar kravet "oavsett användare", och eftersom deadline-jämförelsen ändå görs klientsidigt är det enklare och mer enhetligt än att lägga till ett `where("deadline", "<=", ...)`-filter som ändå bara skulle spara en trivial mängd data för den här appens skala.

**I `onSnapshot`s callback**: mappa `snapshot.docs.map(d => d.data())`, filtrera klientsidigt (`deadline > now` för active/assigned, `deadline <= now` för expired — `now` beräknas när snapshotet processas), sortera fallande på `createdAt`, sätt `{status: "ready", heists: filtered}`. Felcallback sätter `{status: "error", error}`. Effektens dependency-array: `[mode, authStatus, user?.uid]` (inte hela `user`-objektet, för att undvika onödiga omprenumerationer). `useEffect` returnerar `unsubscribe` (från `onSnapshot`) för cleanup vid unmount/läges-byte.

**Medveten begränsning (dokumenteras med kommentar i koden, byggs inte runt)**: en heist som blir "expired" enbart för att klockan passerar dess deadline flyttas inte automatiskt mellan sektionerna förrän nästa Firestore-skrivning triggar ett nytt snapshot — realtidskravet gäller reaktion på Firestore-data, inte en levande klocka. Ingen `setInterval`-baserad omevaluering byggs.

## `components/HeistTitleList/` (ny komponent, 3-filsmönstret)

Tar en `mode: HeistsMode`-prop, anropar `useHeists(mode)`, och renderar:
- **Laddning**: en `Clock8`-spinner (`animate-spin`, `role="status"`, egen CSS-modul — separat från `Loader.tsx` och `Clock8`s statiska varumärkesanvändning i `Navbar`/`LandingHero`, ingen krock eftersom CSS-moduler namnrymdas per fil).
- **Fel**: `<p role="alert" className={styles.error}>` — samma visuella mönster som `CreateHeistForm`s `errors.form`.
- **Tom lista**: `<p className={styles.hint}>` med text som "No heists here yet." — samma mönster som `CreateHeistForm`s "no one else to assign"-text.
- **Annars**: `<ul>` med en `<li key={heist.id}>{heist.title}</li>` per heist — bara titeln, inget annat, enligt specens uttryckliga avgränsning.

`.hint`/`.error`-klasserna återanvänder samma Tailwind-recept (`text-body text-sm` / `text-error text-sm`) som `CreateHeistForm.module.css`.

## `app/(dashboard)/heists/page.tsx`

Behåller de tre wrapper-`<div>`arna och `<h2>`-rubrikerna oförändrade, lägger bara till `<HeistTitleList mode="active" />` (osv.) inuti varje. Sidan behöver inget `"use client"` — `HeistTitleList`/`useHeists` bär klientgränsen, en server-sida kan rendera klientkomponenter direkt.

## Tester

**`tests/lib/useHeists.test.ts`** — mockar `@/lib/firebase` (`{db: {}}`), `@/lib/useAuthState` direkt (samma mönster som `CreateHeistForm.test.tsx`), och `firebase/firestore`s `collection`/`query`/`where`/`onSnapshot`. Fångar `onSnapshot`s callback via `mock.calls[0]` och kör den i `act()` (samma mönster som `useAuthState.test.ts`/`RouteGuard.test.tsx`). Scenarier:
- Laddning medan auth inte är känd; `onSnapshot` anropas inte.
- `active`/`assigned` bygger rätt `where`-filter (`assignedTo`/`createdBy` == uid).
- `expired` bygger **inget** `where`-filter.
- Klientsidig filtrering: `active`/`assigned` exkluderar passerade deadlines; `expired` inkluderar passerade deadlines **inklusive en med `finalStatus: null`** (regressionstest mot den klargjorda definitionen).
- Sortering: nyast `createdAt` först.
- Realtidsbeteende: två på varandra följande snapshot-leveranser uppdaterar resultatet.
- Felcallback → `{status: "error"}`.
- Unsubscribe vid unmount och vid lägesbyte.

**`tests/components/HeistTitleList.test.tsx`** — mockar `@/lib/useHeists` direkt (inte Firestore igen — redan täckt ovan). Scenarier: laddningsspinner (`role="status"`), felmeddelande (`role="alert"`), tomt-läge-text, lista med rätt titlar i given ordning, att `mode`-propen skickas vidare korrekt till `useHeists`.

## Verifiering

1. `npx vitest run`, `npm run lint` (extra uppmärksamhet på `react-hooks/exhaustive-deps` för `useHeists`s effekt), `npx tsc --noEmit` — alla rena.
2. `npm run dev`: skapa flera heists via `/heists/create` med varierande tilldelning; kontrollera i Firebase-konsolen att en heist med manuellt bakåtflyttad `deadline` och `finalStatus: null` dyker upp under "All Expired Heists" (nyckelregressionskontroll). Öppna `/heists` i två flikar, skapa/ändra en heist i den ena, bekräfta att den andra uppdateras utan omladdning. Bekräfta att endast titlar visas i varje sektion, samt tomt-läge/fel-vyerna.
