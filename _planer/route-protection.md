# Ruttskydd baserat på autentiseringsstatus

## Kontext

Enligt `_specs/route-protection.md` ska sidorna i `app/(public)/` (`/`, `/login`, `/signup`, `/preview`) bara vara nåbara för utloggade användare, och sidorna i `app/(dashboard)/` (`/heists`, `/heists/create`, `/heists/[id]`) bara vara nåbara för inloggade användare. Idag finns ingen sådan spärr alls — vem som helst kan navigera direkt till valfri URL oavsett inloggningsstatus. Detta är grundplattan för att appens autentisering (Firebase Auth, redan kopplad i `AuthForm`/`Navbar`) faktiskt ska betyda något.

Bekräftat i specen:
- Inloggade användare som når en `(public)`-sida skickas **alltid** till `/heists` (inget undantag, ingen "kom ihåg destination").
- Utloggade användare som når en `(dashboard)`-sida skickas **alltid** till `/login`.
- En laddningsindikator som matchar appens design ska visas medan autentiseringsstatusen kontrolleras, så inget fel sidinnehåll hinner blinka till.
- Om autentiseringskontrollen misslyckas (t.ex. nätverksfel) ska ett felmeddelande visas — inte tyst behandlas som utloggad.
- Skyddet ska gälla på routegrupp-nivå (layout), inte per sida.

## Ny delad logik: `lib/useAuthState.ts`

Ingen `hooks/`-mapp finns i repot; delad klientlogik utan JSX hör hemma i `lib/` bredvid `lib/firebase.ts` (som redan exporterar `auth`). Ny fil, `"use client"`, ingen `index.ts`-barrel (matchar att `lib/firebase.ts` inte har någon):

```ts
export type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "error"; user: null; error: Error };

export function useAuthState(): AuthState { ... }
```

Wirear `onAuthStateChanged(auth, onNext, onError)` från `firebase/auth` i en `useEffect`, en enda gång — detta blir den enda platsen i appen som prenumererar på auth-state. En diskriminerad union (istället för separata boolean-fält) matchar hur `AuthMode`/`FormErrors` redan är typade i `AuthForm.tsx`, och gör att konsumenter kan exhaustive-switcha på `status`.

## Ny komponent: `components/RouteGuard/`

Följer 3-filsmönstret (`RouteGuard.tsx`, `RouteGuard.module.css`, `index.ts`). En enda återanvändbar guard istället för två nästan identiska (`RequireAuth`/`RequireGuest`) — skillnaden mellan riktningarna är bara vilket `status` som räknas som "fel":

```tsx
"use client";

interface RouteGuardProps {
  mode: "require-authenticated" | "require-unauthenticated";
  redirectTo: string;
  children: React.ReactNode;
}
```

Beteende:
- `status === "loading"` → rendera `<Loader />`.
- `status === "error"` → rendera ett inline felmeddelande (`role="alert"`), ingen omdirigering.
- Fel håll (`shouldRedirect` sant, dvs. autentiserad men vill ha oautentiserad, eller vice versa) → `useEffect` kör `router.replace(redirectTo)`, och **render-grenen** returnerar `<Loader />` (inte `children`) redan innan effekten hinner köra. Detta är vad som faktiskt förhindrar flimmer — fel innehåll hamnar aldrig i trädet, inte ens för en enda paint.
- Annars → rendera `children`.

`router.replace` (inte `push`) används specifikt för guardens ofrivilliga omdirigering, så att bakåtknappen inte studsar rätt tillbaka in i samma omdirigeringsloop. Detta är avsiktligt asymmetriskt mot de befintliga `router.push`-anropen i `AuthForm`/`Navbar` (se nedan) som är medvetna, användarinitierade navigeringar.

## Ny komponent: `components/Loader/`

Server-komponent (ingen interaktivitet), matchar hur `SkeletonCard` också är en ren server-komponent. Återanvänder `animate-spin` (Tailwind-inbyggd, samma mönster som `SkeletonCard`s `animate-pulse`) och befintliga designtokens — `--color-primary` (samma lila som `.btn`) och `--color-dark` (samma som `body`s `bg-dark` i `globals.css`), `min-h-lvh` för fullhöjd likt `.center-content`.

```tsx
import { LoaderCircle } from "lucide-react";

export default function Loader() {
  return (
    <div className={styles.loader} role="status" aria-label="Loading">
      <LoaderCircle className={styles.spinner} />
    </div>
  );
}
```

`role="status"` ger ett tillgängligt namn så tester kan hitta den via `getByRole("status")`. Ingen props behövs — samma fullsides-loader återanvänds identiskt varhelst den behövs.

## Ändringar i layouterna

Båda layouterna förblir server-komponenter — `RouteGuard` (klientkomponent) används bara som en wrapping child, exakt samma mönster som redan bevisat fungera med `Navbar` i `(dashboard)/layout.tsx` idag.

**`app/(public)/layout.tsx`**: wrap `{children}` i `<RouteGuard mode="require-unauthenticated" redirectTo="/heists">`.

**`app/(dashboard)/layout.tsx`**: wrap **både** `<Navbar />` och `<main>{children}</main>` i `<RouteGuard mode="require-authenticated" redirectTo="/login">` — `Navbar` läggs medvetet innanför guarden så att den (inklusive Logout-knappen) aldrig hinner synas innan användaren är verifierad som inloggad.

Inga sidfiler (`page.tsx`) behöver ändras — samtliga 7 befintliga rutter (`/`, `/login`, `/signup`, `/preview`, `/heists`, `/heists/create`, `/heists/[id]`) ärver skyddet automatiskt via sin routegrupp-layout.

## Befintliga redirects i `AuthForm.tsx` och `Navbar.tsx` — behålls oförändrade

`AuthForm.tsx`s `router.push("/heists")` efter lyckad inloggning/registrering och `Navbar.tsx`s `router.push("/login")` efter utloggning **rörs inte**. De ger snabb, avsiktlig navigering direkt efter en användarhandling, medan `RouteGuard` är en korrekthets-backstop för allt annat (direkt URL-navigering, bakåt/framåt-knappen, en flik som stått öppen över en session-ändring i en annan flik). Ingen risk för dubbel-redirect-flimmer: Firebase uppdaterar sitt interna auth-state synkront innan sign-in/sign-up-promisen ens löser ut, så när `RouteGuard` monteras i det nya trädet hinner dess egen `onAuthStateChanged` i praktiken alltid landa på rätt status direkt (i värsta fall en kort `Loader`, aldrig en felaktig bounce).

## Tester

**`tests/lib/useAuthState.test.ts`** (ny `tests/lib/`-mapp, speglar `lib/`): mocka `@/lib/firebase` och `firebase/auth`s `onAuthStateChanged` (fånga `onNext`/`onError`-callbacken), använd `renderHook` från `@testing-library/react` (redan tillgänglig, v16.3.0). Verifiera initialt `"loading"`, övergång till `"authenticated"`/`"unauthenticated"` via `onNext`, övergång till `"error"` via `onError`, samt att unmount avregistrerar prenumerationen.

**`tests/components/RouteGuard.test.tsx`**: samma mock-mönster som redan etablerat i `AuthForm.test.tsx`/`Navbar.test.tsx` (`vi.mock("@/lib/firebase", ...)`, `vi.mock("firebase/auth", ...)`, `vi.mock("next/navigation", ...)`). Driv fram auth-status manuellt genom att anropa den fångade `onNext`/`onError`-callbacken. Scenarier:
- Visar `Loader` (`getByRole("status")`) och inte `children` medan status fortfarande är `"loading"`.
- `require-authenticated` + utloggad → `router.replace("/login")`, `children` renderas aldrig.
- `require-authenticated` + inloggad → `children` renderas, ingen redirect.
- `require-unauthenticated` + inloggad → `router.replace("/heists")`, `children` renderas aldrig.
- `require-unauthenticated` + utloggad → `children` renderas, ingen redirect.
- Simulerat fel → felmeddelande (`getByRole("alert")`) visas, ingen redirect, `children` renderas aldrig.

`components/Loader` får inget eget test — matchar att `SkeletonCard` (närmaste jämförbara statiska, prop-lösa komponent) heller inte har något dedikerat test.

Inga separata layout-tester behövs — layouterna innehåller ingen egen logik utöver att rendera `RouteGuard`, vilket redan täcks av `RouteGuard.test.tsx`.

## Verifiering

1. `npx vitest run` — alla nya och befintliga tester ska gå igenom.
2. `npm run lint` och `npx tsc --noEmit` — inga nya fel.
3. `npm run dev` och manuellt i webbläsaren:
   - Utloggad → navigera direkt till `/heists/create`: kort `Loader`, sedan redirect till `/login`, inget dashboard-innehåll syns.
   - Inloggad → navigera direkt till `/`, `/signup`, `/preview`: kort `Loader`, sedan redirect till `/heists`.
   - Verifiera att laddaren visuellt matchar appens tema (lila `--color-primary` på mörk bakgrund).
   - Throttla nätverket (Slow 3G) och ladda om `/heists` inloggad — `Loader` ska synas märkbart, inget innehåll ska hinna visas innan den löser ut.
   - Logga in från `/login` och logga ut från `/heists` — bekräfta snabb, ren övergång utan dubbelt laddar-flimmer.
   - Testa bakåtknappen efter en guard-omdirigering — ska inte loopa tillbaka.
