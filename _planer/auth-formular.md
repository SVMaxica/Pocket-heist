# Auth-formulär för /login och /signup

## Kontext

`/login` och `/signup` visar idag bara platshållarrubriker (`app/(public)/login/page.tsx`, `app/(public)/signup/page.tsx`) utan fungerande formulär. Enligt specifikationen `_specs/auth-formular.md` ska båda sidorna få ett riktigt autentiseringsformulär (e-post + lösenord, visa/dölj-lösenord, skicka-knapp) som växlar mellan inloggnings- och registreringsläge helt klientsidigt (ingen sidnavigering, ingen URL-ändring). Ingen riktig autentisering finns än — vid giltig inskickning ska uppgifterna bara skrivas ut i konsolen. Detta är grundplattan för framtida autentisering i appen.

Beslut som klargjorts med användaren under planeringen:
- Vid växling av läge ska ifyllda fält (e-post/lösenord) **rensas**.
- Lösenordsvalideringen är enbart "obligatoriskt" — ingen minimilängd eller komplexitetskrav.
- Rubriken ("Sneak Back In" / "Signup for an Account") ska flyttas in i den delade formulärkomponenten och styras av läget, istället för att ligga statisk i respektive sidfil — annars riskerar den bli missvisande efter en klientsidig växling.

## Ny komponent: `components/AuthForm/`

Följer det befintliga 3-filsmönstret (se `components/Avatar/`):
- `AuthForm.tsx` — klientkomponent (`"use client"`, första i repot — motiverat av `useState`/eventhanterare).
- `AuthForm.module.css` — börjar med `@reference "../../app/globals.css";`, återanvänder befintliga design-tokens/utility-klasser (`--color-error`, `--color-body`, `--color-primary`, `.btn`) istället för att återuppfinna dem.
- `index.ts` — `export { default } from "./AuthForm"`.

**Props:** `interface AuthFormProps { initialMode: "login" | "signup" }` (typ `AuthMode` definieras/exporteras i filen).

**State (`useState`):**
- `mode` — initieras från `initialMode` (läses bara en gång; ändras därefter enbart via växlingsknappen, inte av prop-ändringar — avsiktligt).
- `email`, `password` — kontrollerade fält, startvärde `""`.
- `showPassword` — boolean, startvärde `false`.
- `errors: { email?: string; password?: string }`.

**Härledda värden (ingen extra state):**
- Rubrik: `"Sneak Back In"` (login) / `"Signup for an Account"` (signup) — flyttas hit från sidfilerna.
- Knapptext: `"Log In"` / `"Sign Up"`.
- Växlingstext under formuläret, t.ex. "Don't have an account? Sign Up" / "Already have an account? Log In" — en enkel klickbar text/knapp, ingen segmented control.

**Eventhanterare:**
- `handleEmailChange` / `handlePasswordChange` — uppdaterar fältet och rensar ev. befintligt fel för just det fältet direkt (inte bara vid nästa submit).
- `handleTogglePasswordVisibility` — växlar `showPassword`; knapp med `type="button"` och `aria-label` som beskriver åtgärden ("Show password"/"Hide password") eftersom lucide-ikonen (`Eye`/`EyeOff` från `lucide-react`) inte ger något tillgängligt namn i sig.
- `handleToggleMode` — växlar `mode` OCH nollställer `email`, `password` och `errors` (enligt beslutet ovan). `type="button"`.
- `handleSubmit` — `e.preventDefault()`, kör validering synkront, sätter `errors`. Endast om båda fälten är giltiga: `console.log(...)` med e-post och lösenord, inga fel visas. Vid ogiltig data: visa fel, logga inget.

Både `handleTogglePasswordVisibility`- och `handleToggleMode`-knapparna måste ha `type="button"` — annars triggar de en oavsiktlig native form-submit inuti `<form>`.

## Validering (i `AuthForm.tsx`)

- E-post: obligatorisk (`""`-check) + enkel regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) om icke-tom.
- Lösenord: enbart obligatorisk (`""`-check), ingen längd/komplexitet.
- Beräknas endast i `handleSubmit` (ingen live-validering vid varje tangenttryckning); rensas per fält direkt när användaren redigerar det fältet igen, samt helt vid lägesväxling.
- `type="email"` används för semantik/mobiltangentbord, men native `required`/`pattern` hoppas över (eller `noValidate` på `<form>`) för att undvika dubbla felmeddelanden (webbläsarens + vår egen).
- Egna `<label htmlFor>`-kopplingar för båda fälten (krävs för tillgänglighet och för `getByLabelText` i tester).
- `autoComplete="email"` respektive `autoComplete={mode === "login" ? "current-password" : "new-password"}`.

## Sidfilerna

- `app/(public)/login/page.tsx`: byt namn på funktionen till `LoginPage` (fixar befintligt namnfel `SignupPage`), rendera `<AuthForm initialMode="login" />` inuti befintliga `.center-content`/`.page-content`-wrappers. Ta bort den statiska `<h1 className="form-title">`.
- `app/(public)/signup/page.tsx`: rendera `<AuthForm initialMode="signup" />` på samma sätt, ta bort den statiska `<h2 className="form-title">`.
- `app/(public)/layout.tsx`: ingen ändring — ren server-wrapper, fungerar med klientbarn.

## Styling (`AuthForm.module.css`)

Återanvänd `.center-content`/`.page-content`/`.form-title`/`.btn` från `app/globals.css` istället för att duplicera dem. Nytt i modulen:
- `.form` — vertikal flex-layout för fältgrupper + knapp, ev. `max-w-sm mx-auto` så formuläret inte sträcker sig över hela `.page-content`s bredd.
- `.field` — wrapper per label+input(+felmeddelande) för konsekvent spacing.
- Label i `--color-body`, input i mörkt tema (`--color-light`/`--color-lighter` bakgrund, `--color-heading` text, fokusram i `--color-primary`), rundade hörn likt `.btn`.
- `.passwordField` — `position: relative` för att placera visa/dölj-ikonen inuti fältet (höger sida), med höger-padding på inputen så text inte hamnar under ikonen.
- `.toggleVisibility` — ikonknapp utan bakgrund/kant.
- `.error` — `text-error text-sm` (Tailwind v4 genererar `text-error` från `--color-error`-token, konsekvent med hur `.btn` använder `bg-primary`).
- `.toggleModePrompt` — diskret text + klickbar del för lägesväxling.
- Submit-knappen använder befintlig global `"btn"`-klass direkt (inte CSS-modulen).

## Tester: `tests/components/AuthForm.test.tsx`

Vitest + Testing Library, samma mönster som `tests/components/Navbar.test.tsx`/`Avatar.test.tsx`, men första användningen av `@testing-library/user-event` (redan installerat, `^14.6.1`) i repot för att simulera skrivning/klick. Konkreta fall:

- Renderar e-post- och lösenordsfält i login-läge (`getByLabelText`, eftersom lösenordsfält inte exponeras via `getByRole("textbox")`).
- Visar "Log In"-knapp i login-läge, "Sign Up"-knapp i signup-läge.
- Visa/dölj-lösenord: växlar `type="password"` ↔ `type="text"` vid klick på ikonknappen, och klick på den knappen loggar aldrig till konsolen (regressionsskydd mot att den råkar bli `type="submit"`).
- Lägesväxling uppdaterar rubrik/knapptext OCH rensar ifyllda e-post-/lösenordsfält.
- Tom inskickning: visar felmeddelanden för båda fälten, `console.log` anropas inte (`vi.spyOn(console, "log")`).
- Ogiltig e-post: visar formatfel för e-post, inget fel för lösenord, loggar inte.
- Fel för ett fält försvinner så fort användaren redigerar det fältet igen, utan att behöva skicka in på nytt.
- Giltig inskickning: `console.log` anropas med rätt e-post/lösenord, inga felmeddelanden visas.

Inga separata sidtester (`tests/app/...`) läggs till — matchar befintlig konvention där endast `components/` testas; sidfilerna blir triviala one-liners som testas indirekt via `AuthForm`-testerna.

## Verifiering

1. `npx vitest run tests/components/AuthForm.test.tsx` — alla nya tester ska gå igenom.
2. `npm run lint` — inga nya lint-fel.
3. `npm run dev` och manuellt i webbläsaren:
   - Besök `/login`: rätt rubrik/knapptext, fyll i fält, testa visa/dölj-lösenord.
   - Klicka växlingslänken: fälten töms, rubrik/knapptext byts till signup utan sidladdning (URL ändras inte).
   - Testa tom inskickning och ogiltig e-post → felmeddelanden visas, inget i konsolen.
   - Fyll i giltiga uppgifter → kontrollera i webbläsarkonsolen att e-post/lösenord loggas.
   - Besök `/signup` direkt → startar i signup-läge.
