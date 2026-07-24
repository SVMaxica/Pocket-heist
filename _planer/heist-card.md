# Plan: HeistCard-komponent (_specs/heist-card.md)

## Context

`/heists` visar idag aktiva och tilldelade uppdrag som en ren textlista (`HeistTitleList` → `<ul><li>{heist.title}</li></ul>`), utan länk, metadata eller visuell struktur. Specifikationen i `_specs/heist-card.md` (branch `claude/feature/heist-card`) kräver en riktig kortkomponent — **HeistCard** — som visar titel (länkad till `/heists/:id`), mottagar-/skaparkodnamn och deadline/tidsstatus, layoutad i ett responsivt rutnät (1/2/3 kolumner: mobil/tablet/desktop). En matchande **HeistCardSkeleton** ska visas i samma rutnätsposition medan data laddas, så sidan inte hoppar. Designen är hämtad från `public/figmadesign1.jpg` via en design-extraction-analys tidigare i sessionen. Alla öppna frågor i specen är redan besvarade av användaren (kodnamn som text+ikon, inget finalStatus-stöd ännu, återanvänd `--color-light`, hover bara på titellänken, breakpoints 1/2/3 kolumner).

Detaljsidan `/heists/[id]` rörs inte — den förblir en tom platshållare.

## Rekommenderad implementation

### 1. `lib/heistTimeStatus.ts` — deadline/tidsstatus som ren funktion

```ts
export interface HeistTimeStatus { label: string; isOverdue: boolean; }
export function getHeistTimeStatus(deadline: Date, now: Date = new Date()): HeistTimeStatus
```
- `diffMs <= 0` → `{ label: "Overdue", isOverdue: true }` (täcker "deadline nyss passerad men fortfarande i active/assigned-listan").
- `days >= 1` → `"{days}d {hours}h"` (matchar Figma: "1d 0h", "2d 0h").
- annars → `"{hours}h {minutes}m"` (matchar Figma: "4h 42m", inkl. `0h`-prefix under en timme).
- `now`-parametern följer samma injektionsmönster som `buildCreateHeistInput` i `types/firestore/heist.ts`, för deterministisk testning.
- `isOverdue` hålls separat från `label` så statusen aldrig kommuniceras enbart via färg (acceptanskriterium).

### 2. `components/HeistCard/` — server component, `{ heist: Heist }`

Renderingsordning (matchar `figmadesign1.jpg`):
1. Header: `<Link href={`/heists/${heist.id}`}>` runt titeln (`h3`, `line-clamp-2`) + `Clock8`-ikon (dekorativ, `aria-hidden`) i hörnet.
2. Metarad "To:" — `User`-ikon (`aria-hidden`) + `heist.assignedToCodename || "Unassigned"` i accentfärg.
3. Metarad "By:" — samma mönster med `heist.createdByCodename || "Unknown"`.
4. Datumrad — `Calendar`-ikon + formaterat datum + `•` + `getHeistTimeStatus(heist.deadline).label`.

CSS (`HeistCard.module.css`, `@reference "../../app/globals.css"`): kort = `bg-light rounded-xl p-6 flex flex-col gap-3` (ingen skugga/gradient). Endast `.titleLink` får `hover:text-primary` + `focus-visible:outline ... outline-primary` — kortet i övrigt har ingen hover-styling (besvarad öppen fråga). Kodnamn och tidsstatus i `text-primary`. Ikoner via `lucide-react` (`Clock8`, `User`, `Calendar`, redan installerat), storlek `size={14-16} strokeWidth={2.75}` i linje med `Navbar`.

### 3. `components/HeistCardSkeleton/` — server component, inga props

Speglar `HeistCard` rad för rad (inte `SkeletonCard`s generiska avatar+header-layout): titel-linje (bred) + liten ikon-platshållare i header, två meta-linjer, en datum-linje. Samma `bg-light rounded-xl p-6`-bas som `HeistCard` + `animate-pulse` och `bg-body/20`-linjer, i linje med det etablerade mönstret i `components/SkeletonCard/`. `role="status" aria-label="Loading heist"` per kort.

### 4. `components/HeistCardGrid/` — ny klientkomponent (`"use client"`)

Samma konsumtionsmönster som `components/HeistTitleList/HeistTitleList.tsx`: tar `mode: Extract<HeistsMode, "active" | "assigned">`, anropar `useHeists(mode)` och grenar på status:
- `loading` → rutnät med 3 `HeistCardSkeleton` (fyller en desktop-rad).
- `error` → `role="alert"`-text (samma ordalydelse som `HeistTitleList`).
- tomt → hint-text (samma ordalydelse som `HeistTitleList`).
- `ready` → rutnät av `HeistCard` per heist.

Rutnäts-CSS: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` — Tailwind v4:s standardbrytpunkter (`md` ≥768px, `lg` ≥1024px), inga anpassade breakpoints finns i projektet sedan tidigare, så detta ger exakt mobil/tablet/desktop-kraven utan att införa ny konfiguration.

`page.tsx` äger fortfarande sektionsrubrikerna (`<h2>`) — `HeistCardGrid` ersätter bara `HeistTitleList` inuti active/assigned-sektionerna, ingen ändring av `useHeists` eller sidans struktur krävs.

### 5. `app/(dashboard)/heists/page.tsx`

Byt `<HeistTitleList mode="active" />` och `<HeistTitleList mode="assigned" />` mot `<HeistCardGrid mode="..." />`. `expired-heists`-sektionen behåller `HeistTitleList mode="expired"` oförändrad.

### 6. Panelfärg

Ingen ny CSS-variabel. `--color-light` (#0A101D) återanvänds — redan etablerad för paneler i `SkeletonCard` och `Navbar`, och matchar designbildens mörka kortyta mot `--color-dark`-sidbakgrunden.

## Filer som skapas/ändras

**Nya:**
- `lib/heistTimeStatus.ts` + `tests/lib/heistTimeStatus.test.ts`
- `components/HeistCard/{HeistCard.tsx, HeistCard.module.css, index.ts}` + `tests/components/HeistCard.test.tsx`
- `components/HeistCardSkeleton/{HeistCardSkeleton.tsx, HeistCardSkeleton.module.css, index.ts}` + `tests/components/HeistCardSkeleton.test.tsx`
- `components/HeistCardGrid/{HeistCardGrid.tsx, HeistCardGrid.module.css, index.ts}` + `tests/components/HeistCardGrid.test.tsx`

**Ändras:**
- `app/(dashboard)/heists/page.tsx`

**Rörs inte:** `app/(dashboard)/heists/[id]/page.tsx`, `lib/useHeists.ts`, `app/globals.css`, `components/HeistTitleList/*`.

## Testplan (mönster: `tests/components/HeistTitleList.test.tsx`, `vi.mock("@/lib/useHeists", ...)`)

- **`heistTimeStatus.test.ts`**: förfluten deadline → Overdue/isOverdue; gränsfall `deadline === now`; 4h42m-, 1-dags-, flerdagars- och 5-minutersfall (bekräftar `0h`-prefix); injicerad `now` respekteras.
- **`HeistCard.test.tsx`** (props, ingen hook-mock behövs): rätt titel/kodnamn renderas; titellänk har `href="/heists/<id>"`; visar "Overdue" resp. tid-kvar beroende på deadline (`vi.setSystemTime()` för determinism); fallback-text vid saknat kodnamn; dekorativa ikoner har `aria-hidden`.
- **`HeistCardSkeleton.test.tsx`**: renderar utan props; `getByRole("status")` med laddnings-`aria-label`.
- **`HeistCardGrid.test.tsx`** (mocka `useHeists`): loading → 3 skelettkort; error → `role="alert"`; tomt → hint-text; ready → ett `HeistCard`/heist i rätt ordning; `mode` skickas vidare till `useHeists`.
- Ingen separat sidnivå-test behövs — `page.tsx` har ingen egen logik utöver komposition.

## Verifiering

1. `npm test` (Vitest) — alla nya och befintliga tester gröna.
2. `npm run lint` — inga ESLint-fel.
3. `npm run dev` och besök `/heists` inloggad: kontrollera att active/assigned visas som ett 1/2/3-kolumners rutnät av kort med titel-länk, To:/By:-rader och deadline-status, att skeleton syns kort under laddning, att `expired`-sektionen fortfarande är en textlista, och att fönster-resize växlar kolumnantal vid `md`/`lg`.
4. Tangentbordsnavigera till ett kort och verifiera synligt fokusläge enbart på titellänken.
