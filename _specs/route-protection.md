# Specifikation för route-protection

Branch: `claude/feature/route-protection`

Figma-komponent (om den används): `Ej tillämpligt`

---

## Sammanfattning

Appen ska få ruttskydd baserat på användarens autentiseringsstatus. Sidorna i `(public)`-gruppen (t.ex. `/`, `/login`, `/signup`, `/preview`) ska endast vara åtkomliga för användare som **inte** är inloggade, och sidorna i `(dashboard)`-gruppen (t.ex. `/heists`, `/heists/create`, `/heists/[id]`) ska endast vara åtkomliga för användare som **är** inloggade. Om en användare försöker nå en sida den inte har åtkomst till ska den istället dirigeras till rätt del av appen. Medan autentiseringsstatusen kontrolleras och en eventuell omdirigering sker ska en laddningsindikator visas, i linje med appens övriga design, istället för att fel sidinnehåll blinkar till eller visas för kort.

---

## Funktionella krav

- Användare som **inte** är inloggade och försöker nå en sida i `(dashboard)`-gruppen ska dirigeras till inloggningssidan.
- Användare som **är** inloggade och försöker nå en sida i `(public)`-gruppen ska dirigeras till dashboard-vyn.
- Detta ska gälla för samtliga befintliga sidor i respektive grupp, inte bara enstaka sidor.
- Medan appen kontrollerar om användaren är inloggad eller ej ska en laddningsindikator visas, istället för sidans faktiska innehåll.
- Laddningsindikatorn ska visuellt matcha appens befintliga design (färger, typografi osv.).
- Ingen sida i fel grupp ska hinna synas för användaren (inget "flimmer") innan omdirigeringen sker.

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** Ej tillämpligt
- **Komponentnamn:** Ej tillämpligt
- **Viktiga visuella krav:** Laddningsindikatorn ska kännas som en del av appen och återanvända befintliga designtokens (t.ex. färgtema och typografi) snarare än att se ut som en generisk/frikopplad laddare.

---

## Möjliga specialfall (Edge Cases)

- En inloggad användare navigerar direkt (via URL) till en `(public)`-sida, t.ex. `/login`.
- En utloggad användare navigerar direkt (via URL) till en `(dashboard)`-sida, t.ex. `/heists/create`.
- En inloggad användare besöker rotsidan `/`.
- Autentiseringskontrollen tar en stund att slutföras (t.ex. vid sidladdning eller omladdning) — sidan ska inte visa fel innehåll under tiden.
- Användaren klickar på "Logout" medan den befinner sig på en dashboard-sida, och ska hamna på rätt ställe.
- Användaren använder webbläsarens bakåt-/framåtknapp efter att ha blivit omdirigerad.
- Autentiseringskontrollen misslyckas (t.ex. på grund av nätverksfel) — det ska vara tydligt hur detta ska hanteras.

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- Utloggade användare som försöker nå en `(dashboard)`-sida dirigeras till inloggningssidan.
- Inloggade användare som försöker nå en `(public)`-sida, inklusive rotsidan `/`, dirigeras till dashboard-vyn.
- En laddningsindikator som matchar appens design visas under tiden autentiseringsstatusen kontrolleras och innan omdirigering sker.
- Inget felaktigt sidinnehåll (skyddat eller publikt) blinkar till för användaren innan omdirigeringen är klar.
- Beteendet gäller konsekvent för alla befintliga sidor i båda routegrupperna.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Ska inloggade användare som försöker nå en `(public)`-sida alltid skickas till `/heists`, eller finns det undantag? skicka de alltid till heists
- Ska den ursprungliga destinationen (t.ex. `/heists/create`) komma ihåg och användaren skickas dit efter inloggning, eller räcker det att alltid landa på `/heists`/`/login`? ja det räcker att landa där
- Om autentiseringskontrollen misslyckas (t.ex. nätverksfel) — ska användaren behandlas som utloggad, eller ska ett separat felmeddelande visas? visa felmeddelade

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att en utloggad användare som försöker nå en dashboard-sida dirigeras till inloggningssidan.
- Att en inloggad användare som försöker nå en public-sida dirigeras till dashboard-vyn.
- Att laddningsindikatorn visas medan autentiseringsstatusen ännu inte är känd.
- Att rätt sidinnehåll visas (utan onödig omdirigering) för en användare som redan befinner sig i rätt routegrupp för sin autentiseringsstatus.
