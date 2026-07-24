# Specifikation för expired-heist-cards-homepage

Branch: `claude/feature/expired-heist-cards-homepage`

Figma-komponent (om den används): `Heist Card` (Overdue-tillståndet i dashboardvyn, `public/figmadesign1.jpg`) — se viktig anmärkning under Figma-referens.

---

## Sammanfattning

Startsidan (`/`) ska visa en sektion med kort för utgångna ("expired"/förfallna) heists, så att besökaren snabbt får en känsla för uppdragstypen och aktiviteten i appen redan innan de loggar in eller navigerar till `/heists`. Sektionen återanvänder samma kortmönster som den befintliga HeistCard-komponenten, men anpassat till startsidans mörkare hero-tema.

---

## Funktionella krav

- Startsidan visar en tydligt avgränsad sektion med kort för heists vars deadline har passerat.
- Varje kort visar: uppdragets titel, mottagarens kodnamn ("To:"), skaparens kodnamn ("By:"), samt förfallodatum tillsammans med en tydlig text-etikett som anger att uppdraget är utgånget (t.ex. "Overdue"/"Expired").
- Sektionen har en rubrik i samma visuella ton som startsidans befintliga hero-sektion (case file-tema).
- Om inga utgångna heists finns visas ett kort, textbaserat tomt tillstånd istället för kortlistan.
- Uppdragets status kommuniceras alltid med text, inte enbart med färg eller ikon.
- Sektionen är responsiv och fungerar på mobil, surfplatta och desktop.

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** `public/figmadesign1.jpg`
- **Komponentnamn:** Heist Card, Overdue-tillstånd (från dashboardvyns kortmönster)
- **Viktiga visuella krav:**
  - Mörk kortyta med rundade hörn och generös inre padding, i linje med befintliga HeistCard-kort.
  - Korttitel i vit, fet text.
  - Rad med mottagarens kodnamn ("To:") i primärfärg (lila) och rad med skaparens kodnamn ("By:") i sekundärfärg (rosa), båda föregångna av en liten personikon.
  - Datumrad med kalenderikon samt statustext för att uppdraget är utgånget.
  - Klockikon som statusindikator.
- **Viktig anmärkning:** Den analyserade designbilden visar `/heists`-sidans dashboardvy (Active/Assigned/History), inte startsidan. Det finns ingen direkt Figma-referens för hur en "expired heists"-sektion ska placeras och se ut på just `/`. Kortets utseende ovan är hämtat direkt från bilden, men layouten och placeringen på startsidan är en rimlig extrapolering baserad på befintlig HeistCard- och startsidans hero-stil, inte en direkt Figma-observation. Se Öppna frågor.

---

## Möjliga specialfall (Edge Cases)

- Inga utgångna heists finns — det tomma tillståndet visas istället för kortlistan.
- Ett stort antal utgångna heists finns samtidigt.
- Ett uppdrag saknar tilldelad person eller skapare i visningen.
- Mycket lång uppdragstitel eller kodnamn som inte får plats i kortet.
- En besökare som inte är inloggad ser sektionen på startsidan.
- Ett uppdrags deadline har precis passerat och det är oklart om det redan räknas som "utgånget" i visningen.

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- Startsidan visar en tydligt avgränsad sektion med kort för utgångna heists.
- Varje kort visar titel, mottagarens kodnamn, skaparens kodnamn, förfallodatum och en tydlig text-etikett för att uppdraget är utgånget.
- Statusen är läsbar utan att enbart förlita sig på färg.
- Ett tomt tillstånd visas när inga utgångna heists finns.
- Sektionen är responsiv och fungerar på mobil, surfplatta och desktop.
- Den visuella stilen är konsekvent med befintliga HeistCard-kort och startsidans hero-tema.
- Dekorativa ikoner är dolda för skärmläsare.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Designbilden visar inte startsidan, bara `/heists`-vyn. Ska layouten och placeringen av sektionen på startsidan godkännas separat, eller är extrapoleringen i denna spec (kort i HeistCard-stil under/i anslutning till hero-sektionen) tillräcklig för att gå vidare? de ska ligga i hesist vyn under de acktiva och tilldelade heist korten samt följa desigenn på bilden.
- Ska sektionen visas för alla besökare (inloggade och icke-inloggade), eller bara för inloggade användare? bara inloggade.
- Ska korten vara klickbara och länka vidare till respektive heists detaljsida, som på `/heists`? ja.
- Ska "utgången"-statusen använda samma lila accentfärg som i designbilden, eller en tydligare felfärg (röd) för bättre semantisk distinktion från aktiva uppdrag? ja
- Finns det ett maxantal kort som ska visas på startsidan (t.ex. de senast utgångna), eller ska alla utgångna heists visas? visa alla med senaste överst.
- Vilken text ska det tomma tillståndet visa när inga utgångna heists finns? hitta på nåt passande.

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att sektionen med utgångna heist-kort visar rätt titel, mottagarkodnamn, skaparkodnamn, förfallodatum och statustext för ett givet uppdrag.
- Att det tomma tillståndet visas när inga utgångna heists finns.
- Att statusen förmedlas med text (inte enbart färg) för skärmläsarstöd.
