---
description: Skapa en UI-komponent med TDD (Test-Driven Development)
allowed-tools: Read, Write, Edit, Glob, Bash(npm test:*), Bash(npx vitest:*)
argument-hint: '[Kort beskrivning av komponenten]'
---

## Användarens beskrivning

Användaren har beskrivit komponenten som ska skapas:

**$ARGUMENTS**

## Gör detta först

Utifrån beskrivningen ovan ska du först avgöra ett lämpligt komponentnamn i **PascalCase**.

Exempel:

- "ett kort som visar användarstatistik" → `UserStatsCard`

---

## 1. Skriv tester först

Skapa filen:

`tests/components/[ComponentName].test.tsx`

Skriv 2–3 enkla tester som verifierar att:

- komponenten renderas
- viktiga element finns (roller, text osv.)

Exempel:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ComponentName from '@/components/ComponentName';

describe('ComponentName', () => {
  it('renderas korrekt', () => {
    render(<ComponentName />);

    // assertions
  });
});
```

---

## 2. Kör testerna (förvänta dig att de misslyckas)

```bash
npm test tests/components/[ComponentName].test.tsx
```

---

## 3. Skapa komponenten

Skapa följande filer:

- `components/[ComponentName]/[ComponentName].tsx`
- `components/[ComponentName]/[ComponentName].module.css`
- `components/[ComponentName]/index.ts`

Innehåll i `index.ts`:

```ts
export { default } from './[ComponentName]';
```

### Kodstandard

- Använd inte semikolon.
- Använd CSS Modules.
- Använd temafärger från `globals.css` när det behövs.
- Följ samma struktur som övriga komponenter i projektet.

---

## 4. Kör testerna igen (de ska nu gå igenom)

```bash
npm test tests/components/[ComponentName].test.tsx
```

Fortsätt iterera på komponenten tills samtliga tester passerar.

---

## 5. Lägg till komponenten på Preview-sidan

Uppdatera:

`app/(public)/preview/page.tsx`

Lägg till en tydligt märkt sektion som visar den nya komponenten så att den enkelt kan granskas.

---

# Regler

- Håll testerna enkla och fokuserade.
- Gå aldrig vidare till nästa steg innan det aktuella steget fungerar.
- Följ projektets befintliga struktur och kodstandard.
- Skapa endast den kod som behövs för att uppfylla testerna.
