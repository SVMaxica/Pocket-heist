---
description: Skapa en funktionsspecifikation och en Git-branch utifrån en kort idé
argument-hint: Kort beskrivning av funktionen
allowed-tools: Read, Write, Glob, Bash(git switch:*)
---

Du ska hjälpa till att skapa en ny funktionsspecifikation för projektet utifrån användarens beskrivning nedan.

Följ alltid eventuella regler eller riktlinjer som finns i projektets `CLAUDE.md`-filer.

Användarens beskrivning:

$ARGUMENTS

## Övergripande mål

Din uppgift är att omvandla användarens beskrivning till:

- En tydlig titel för funktionen.
- Ett git-säkert namn i kebab-case.
- En säker Git-branch som inte redan finns.
- En detaljerad specifikation i Markdown som sparas i mappen `_specs`.

Om det finns en designreferens ska specifikationen alltid baseras på den.

Använd subagenten **`figma-design-extractor`** för att analysera designen innan specifikationen skrivs.

När allt är klart ska specifikationen sparas och du ska ge användaren en kort sammanfattning.

---

## Steg 1 – Kontrollera aktuell Git-branch

Kontrollera vilken Git-branch som är aktiv.

Om arbetskatalogen innehåller:

- ej committade ändringar
- ostagade ändringar
- ospårade filer

ska processen avbrytas direkt.

Be användaren att först committa eller stasha sina ändringar.

Gå inte vidare förrän arbetskatalogen är ren.

---

## Steg 2 – Tolka användarens beskrivning

Utifrån `$ARGUMENTS` ska du ta fram:

### feature_title

En kort och tydlig titel i **Title Case**.

Exempel:

`Kortkomponent för dashboard-statistik`

---

### feature_slug

Ett Git-säkert namn enligt följande regler:

- endast gemener
- kebab-case
- endast tecknen `a-z`, `0-9` och `-`
- ersätt mellanslag och skiljetecken med `-`
- slå ihop flera `-` till en
- ta bort `-` i början och slutet
- maximalt 40 tecken

Exempel:

```
kortkomponent
```

eller

```
kortkomponent-dashboard
```

---

### branch_name

Format:

```
claude/feature/<feature_slug>
```

Exempel:

```
claude/feature/kortkomponent
```

Om det inte går att avgöra ett rimligt namn ska du be användaren förtydliga istället för att gissa.

---

## Steg 3 – Byt till en ny Git-branch

Innan någon specifikation skapas ska du byta till den nya Git-branchen baserad på `branch_name`.

Om branchen redan finns ska ett versionsnummer läggas till automatiskt.

Exempel:

```
claude/feature/kortkomponent-01
```

---

## Steg 4 – Samla in designreferenser

Innan specifikationen skapas ska du undersöka om det finns en designreferens.

Om användaren har hänvisat till:

- en Figma-länk
- en Figma-komponent
- en Figma-fil
- en skärmbild av designen

ska du använda subagenten:

```
figma-design-extractor
```

Subagenten ansvarar för att:

- analysera Figma-designen
- eller, om ingen Figma-fil finns, leta efter en Figma-bild i projektets `public`-mapp (vanligtvis innehåller filnamnet ordet `figma`)
- extrahera layout
- färger
- typografi
- spacing
- komponentstruktur
- ikoner
- komponenternas olika tillstånd
- responsivt beteende
- tillgänglighetskrav

Resultatet från subagenten ska användas som underlag när specifikationen skrivs.

Om ingen designreferens hittas ska du fortsätta utifrån användarens beskrivning och tydligt ange vilka delar som bygger på antaganden.

---

## Steg 5 – Skapa specifikationen

Skapa en Markdown-specifikation som kan användas direkt i **Plan mode**.

Specifikationen ska:

- sparas i mappen `_specs`
- använda `feature_slug` som filnamn
- följa exakt samma struktur som mallen

```
@_specs/template.md
```

Om designinformation har hämtats från `figma-design-extractor` ska den integreras naturligt i specifikationen, exempelvis under:

- Sammanfattning
- Funktionella krav
- Figma-referens
- Acceptanskriterier
- Edge Cases

Lägg **inte** till tekniska implementationsdetaljer.

Lägg **inte** till kodexempel.

Lägg **inte** till lösningsförslag.

Specifikationen ska beskriva **vad** som ska byggas, inte **hur** det ska implementeras.

---

## Steg 6 – Svara användaren

När filen har sparats ska du svara med följande format:

```text
Branch: <branch_name>
Specifikation: specs/<feature_slug>.md
Titel: <feature_title>
```

Visa inte hela specifikationen i chatten om inte användaren uttryckligen ber om det.

Målet är att:

- skapa Git-branchen
- skapa specifikationen
- spara den i `_specs`
- använda designanalysen från `figma-design-extractor` när en design finns
- tala om för användaren var specifikationen finns
