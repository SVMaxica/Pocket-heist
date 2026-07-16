---
description: Analysera stage:ade Git-ändringar och skapa ett välformulerat commit-meddelande.
allowed-tools: Bash(git status:*), Bash(git diff --staged), Bash(git commit:*)
---

## Din uppgift

Analysera de stage:ade Git-ändringarna och skapa ett tydligt commit-meddelande.

Använd presens och fokusera på varför ändringarna gjordes, inte bara vad som ändrades.

## Kör följande kommandon för att få kontext

```bash
git status
git diff --staged
```

## Kontrollera även

Kontrollera resultatet från `git status`.

Om det finns filer som är modifierade men **inte stage:ade**, eller helt **untracked**, påminn mig om detta innan du föreslår commit-meddelandet.

Skriv exempelvis:

> ⚠️ Det finns filer som ännu inte är inkluderade i commiten. Kontrollera om de också ska läggas till innan du committar.

## Commit-typer

Använd endast någon av följande:

- ✨ `feat:` – Ny funktion
- 🐛 `fix:` – Buggfix
- 🔨 `refactor:` – Refaktorering
- 📝 `docs:` – Dokumentation
- 🎨 `style:` – Formatering/kodstil
- ✅ `test:` – Tester
- ⚡ `perf:` – Prestandaförbättring

## Format

```
<emoji> <typ>: <kort beskrivning>

<valfri förklaring av varför ändringen gjordes>
```

## Svar

1. Sammanfatta de stage:ade ändringarna.
2. Om det finns ostage:ade eller untracked filer, varna mig innan commit-meddelandet visas.
3. Föreslå det bästa commit-meddelandet.
4. Gör aldrig någon commit eller push.
5. Returnera endast sammanfattningen och commit-meddelandet.
