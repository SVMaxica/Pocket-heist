# Plan: Expired heist-kort på /heists (egen enkolumns-lista + resultatflagga)

## Context

`/heists` har redan en "All Expired Heists"-sektion, men den renderas idag som en enkel textlista (`HeistTitleList`), inte som kort. Enligt spec-svaren ska utgångna heists visas som kort under de aktiva/tilldelade sektionerna — men till skillnad från de sektionerna ska de utgångna korten alltid ligga i **en enda kolumn i full bredd**, oavsett skärmstorlek, och varje kort ska ha en tydlig **resultatflagga** ("Success" eller "Expired") som visar om uppdraget genomfördes innan det gick ut. `finalStatus: "failure"` räknas som "Expired" i flaggan (endast två lägen), och den befintliga tidsstatus-raden (klockikon + röd "Overdue"-text) behålls oförändrad vid sidan av den nya flaggan.

Autentisering, sortering (senaste `createdAt` överst) och länkning till detaljsidan är redan implementerat och kräver inga ändringar.

## Ändringar

**1. `components/HeistCard/HeistCard.tsx` + `HeistCard.module.css`**

- Destrukturera `isOverdue` från `getHeistTimeStatus(heist.deadline)` (redan tillgängligt, används inte idag).
- Klockikon + tidsstatus-text växlar till felfärg (`text-error`) när `isOverdue` är sant, via två nya modifier-klasser (samma `@apply`-mönster som resten av filen, kombinerade med template-literal-strängar som `HeistCardSkeleton` redan använder — inget `clsx` i projektet):
  ```css
  .statusIconOverdue {
    @apply text-error;
  }
  .timeStatusOverdue {
    @apply text-error;
  }
  ```
- Ny resultatflagga: renderas **endast när `isOverdue` är sant** (dvs. bara för utgångna kort — aktiva/tilldelade heists har per definition `deadline > now` så flaggan syns aldrig där av sig själv, ingen extra prop behövs):
  ```tsx
  const resultBadge = isOverdue
    ? heist.finalStatus === 'success'
      ? { label: 'Success', className: styles.resultBadgeSuccess }
      : { label: 'Expired', className: styles.resultBadgeExpired }
    : null;
  ```
  Placeras i headern, i en ny `.statusGroup`-wrapper tillsammans med klockikonen (så `justify-between` fortfarande håller titeln till vänster och gruppen till höger):
  ```css
  .statusGroup {
    @apply flex items-center gap-2 shrink-0;
  }
  .resultBadge {
    @apply text-xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5;
  }
  .resultBadgeSuccess {
    @apply bg-success/15 text-success;
  }
  .resultBadgeExpired {
    @apply bg-error/15 text-error;
  }
  ```

**2. Nytt komponent: `components/HeistCardList/`** (`HeistCardList.tsx`, `HeistCardList.module.css`, `index.ts`)

- Mirrorar `HeistCardGrid` (samma loading/error/empty-hantering, samma `HeistCardSkeleton`), men:
  - `mode` hårdkodas till `"expired"` internt (`useHeists("expired")`) — ingen prop, eftersom detta är den enda användningen och en mode-prop med ett giltigt värde är onödig abstraktion.
  - Layout är en enkolumns, full bredd-stack istället för grid:
    ```css
    .list {
      @apply flex flex-col gap-4 w-full;
    }
    ```
  - Eget tomt-läge-meddelande: "No expired heists yet — your streak of flawless mischief continues."

**3. `app/(dashboard)/heists/page.tsx`**

- Byt import och användning från `HeistTitleList` till `HeistCardList`:
  ```tsx
  <div className="expired-heists">
    <h2>All Expired Heists</h2>
    <HeistCardList />
  </div>
  ```

**4. Ta bort `HeistTitleList` helt**

- Bekräftat via grep: enda användningen var i `page.tsx`, ingen annan referens (inkl. e2e) i kodbasen.
- Radera `components/HeistTitleList/` (hela mappen) och `tests/components/HeistTitleList.test.tsx`.

## Tester

- `tests/components/HeistCard.test.tsx`: lägg till fall som verifierar
  - "Success"-flaggan visas när `finalStatus: "success"` och deadline passerat.
  - "Expired"-flaggan visas när `finalStatus: null` (och separat för `"failure"`) och deadline passerat.
  - Ingen flagga visas när deadline inte har passerat.
- Nytt `tests/components/HeistCardList.test.tsx`, i linje med `HeistCardGrid.test.tsx`s struktur (mock av `@/lib/useHeists`): loading-skeletons, felmeddelande, eget tomt-läge-meddelande, kort renderas i ordning med länkar, samt att `useHeists` anropas med `"expired"`.
- Ta bort `tests/components/HeistTitleList.test.tsx`.

## Verifiering

- `npm test` (Vitest) — alla existerande och nya tester ska passera.
- `npm run lint`.
- `npm run dev` och manuellt kontrollera `/heists` inloggad: att den utgångna sektionen visar kort i en enda kolumn i full bredd (till skillnad från de responsiva flerkolumns-sektionerna ovanför), att varje kort har en "Success"- eller "Expired"-flagga beroende på utfall, att statusfärgen är röd för utgångna kort, att korten länkar till rätt detaljsida, och att tomt-läge-texten visas när det inte finns några utgångna heists.
