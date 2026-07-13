# CLAUDE.md

Denna fil ger vägledning till Claude Code (claude.ai/code) vid arbete med kod i detta repository.

## Kommandon

- `npm run dev` — starta Next.js utvecklingsserver (http://localhost:3000)
- `npm run build` — produktionsbygge
- `npm run start` — kör produktionsbygget
- `npm run lint` — kör ESLint (flat config i `eslint.config.mjs`, baserad på `eslint-config-next`)
- `npm test` — kör Vitest-sviten en gång (eller `npx vitest` för watch-läge)
- `npx vitest run tests/components/Navbar.test.tsx` — kör en enskild testfil
- `npx vitest run -t "renders the Create Heist link"` — kör ett enskilt test via namn

## Arkitektur

Pocket Heist är en Next.js 16 (App Router) + React 19 + TypeScript-app. Det är för närvarande ett skelett-/startprojekt (byggt för Claude Code Masterclass) — de flesta sidor renderar endast platshållarrubriker, utan datahämtning, autentisering eller state ännu.

**Route groups**: katalogen `app/` delar upp rutterna i två layouter som inte delar någon chrome:
- `app/(public)/` — oautentiserade sidor (`/`, `/login`, `/signup`, `/preview`). Dess layout wrappar children i `<main className="public">` utan navbar.
- `app/(dashboard)/` — autentiserade sidor (`/heists`, `/heists/create`, `/heists/[id]`). Dess layout renderar den delade `Navbar`-komponenten ovanför `{children}`.

Rotsidan `/` (`app/(public)/page.tsx`) är en splash-skärm; en kommentar i filen anger dess tilltänkta (ännu inte implementerade) syfte: omdirigera till `/heists` om inloggad, annars till `/login`.

**Domänkoncept**: användare skapar och tilldelar "heists" — små lekfulla uppdrag/spratt — till kollegor, med förfallotid ("Tiny missions. Big office mischief.").

**Komponenter**: ligger under `components/<Namn>/`, var och en med sin egen `<Namn>.tsx`, en `index.ts`-barrel som re-exporterar default, och en CSS Module (`<Namn>.module.css`) för komponentavgränsad styling. Följ detta trefilsmönster för nya komponenter.

**Styling**: Tailwind CSS v4, konfigurerad via `@theme` i `app/globals.css` (ingen `tailwind.config`). Anpassade designtokens (`--color-primary`, `--color-dark`, osv.) och generella layout-utility-klasser (`.page-content`, `.center-content`, `.form-title`) definieras där och återanvänds på sidorna istället för att upprepa Tailwind-utility-strängar.

**Imports**: använd `@/*`-path-aliaset (mappar till repo-roten, konfigurerat i `tsconfig.json`) istället för relativa sökvägar, t.ex. `@/components/Navbar`.

**Testning**: Vitest med jsdom + Testing Library (`vitest.config.mts`, `vitest.setup.ts`). Tester ligger under `tests/`, och speglar källkodsstrukturen (t.ex. testar `tests/components/Navbar.test.tsx` `components/Navbar/`). Föredra `screen.getByRole`-queries framför test-ID:n, i linje med det befintliga Navbar-testet.
