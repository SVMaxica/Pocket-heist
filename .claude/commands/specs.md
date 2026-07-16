---
description: Skapa en funktionsspecifikation och en Git-branch utifrån en kort idé
argument-hint: Kort beskrivning av funktionen
allowed-tools: Read, Write, Glob, Bash(git switch:*)
---

Du ska hjälpa till att skapa en ny funktionsspecifikation för projektet utifrån användarens beskrivning nedan. Följ alltid eventuella regler eller riktlinjer som finns i projektets `CLAUDE.md`-filer.

Användarens beskrivning:

$ARGUMENTS

## Övergripande mål

Din uppgift är att omvandla användarens beskrivning till:

- En tydlig titel för funktionen.
- Ett git-säkert namn i kebab-case.
- En säker Git-branch som inte redan finns.
- En detaljerad specifikation i Markdown som sparas i mappen `_specs`.

När allt är klart ska specifikationen sparas och du ska ge användaren en kort sammanfattning.

---

## Steg 1 – Kontrollera aktuell Git-branch

Kontrollera vilken Git-branch som är aktiv.

Om arbetskatalogen innehåller:

- ej committade ändringar,
- ostagade ändringar,
- eller ospårade filer,

ska processen avbrytas direkt.

Be användaren att först committa eller stasha sina ändringar innan du fortsätter.

Gå inte vidare förrän arbetskatalogen är ren.

---

## Steg 2 – Tolka användarens beskrivning

Utifrån `$ARGUMENTS` ska du ta fram:

### 1. feature_title

En kort och tydlig titel i **Title Case**.

Exempel:

`Kortkomponent för dashboard-statistik`

---

### 2. feature_slug

Ett Git-säkert namn enligt följande regler:

- endast gemener
- kebab-case
- endast tecknen `a-z`, `0-9` och `-`
- ersätt mellanslag och skiljetecken med `-`
- slå ihop flera `-` till en
- ta bort `-` i början och slutet
- maximalt 40 tecken

Exempel:

`kortkomponent`

eller

`kortkomponent-dashboard`

---

### 3. branch_name

Format:

`claude/feature/<feature_slug>`

Exempel:

`claude/feature/kortkomponent`

Om det inte går att avgöra ett rimligt namn ska du be användaren förtydliga istället för att gissa.

---

## Steg 3 – Byt till en ny Git-branch

Innan någon specifikation skapas ska du byta till den nya Git-branchen baserad på `branch_name`.

Om branchen redan finns ska ett versionsnummer läggas till automatiskt.

Exempel:

`claude/feature/kortkomponent-01`

---

## Steg 4 – Skapa specifikationen

Skapa en Markdown-specifikation som kan användas direkt i **Plan mode**.

Specifikationen ska:

- sparas i mappen `_specs`
- använda `feature_slug` som filnamn
- följa exakt samma struktur som mallen i

`@_specs/template.md`

Lägg **inte** till tekniska implementationsdetaljer, kodexempel eller lösningsförslag.

Fokusera endast på vad som ska byggas.

---

## Steg 5 – Svara användaren

När filen har sparats ska du svara med följande format:

```text
Branch: <branch_name>
Specifikation: specs/<feature_slug>.md
Titel: <feature_title>
```

Visa **inte** hela specifikationen i chatten om inte användaren uttryckligen ber om det.

Målet är att:

- skapa och spara specifikationen,
- skapa rätt Git-branch,
- och tala om för användaren var specifikationen finns.
