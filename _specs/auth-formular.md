# Specifikation för auth-formular

Branch: `claude/feature/auth-formular`

Figma-komponent (om den används): `Ej tillämpligt`

---

## Sammanfattning

Sidorna `/login` och `/signup` ska få fungerande autentiseringsformulär. Formulären ska samla in e-postadress och lösenord, låta användaren visa eller dölja det inmatade lösenordet, och skickas via en knapp för respektive syfte (logga in / registrera sig). Ingen faktisk autentisering ska ske ännu — inskickade uppgifter ska tills vidare endast skrivas ut i konsolen. Användaren ska också enkelt kunna växla mellan inloggnings- och registreringsläget utan att lämna sidan.

---

## Funktionella krav

- Formuläret ska innehålla ett fält för e-postadress.
- Formuläret ska innehålla ett fält för lösenord.
- Lösenordsfältet ska ha en ikon/knapp som växlar mellan att visa och dölja det inmatade lösenordet.
- Formuläret ska ha en knapp för att skicka in uppgifterna, med text anpassad efter läge ("Logga in" respektive "Registrera dig").
- Vid inskickat formulär ska e-postadress och lösenord tills vidare endast skrivas ut i konsolen, ingen faktisk inloggning eller registrering ska ske.
- Det ska finnas ett enkelt och tydligt sätt att växla mellan inloggnings- och registreringsläget.
- Formulären på `/login` och `/signup` ska återspegla rätt läge (inloggning respektive registrering) beroende på vilken sida användaren befinner sig på eller har växlat till.

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** Ej tillämpligt
- **Komponentnamn:** Ej tillämpligt
- **Viktiga visuella krav:** Ej tillämpligt

---

## Möjliga specialfall (Edge Cases)

Beskriv situationer som komponenten eller funktionen måste kunna hantera.

- Användaren skickar formuläret med tomma fält.
- Användaren skriver in en e-postadress i felaktigt format.
- Användaren växlar mellan inloggnings- och registreringsläget efter att redan ha fyllt i fält — det ska vara tydligt vad som händer med redan ifylld data.
- Användaren växlar synlighet på lösenordet flera gånger i rad.
- Användaren navigerar direkt till `/login` respektive `/signup` via URL och förväntar sig rätt läge redan från start.

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- Både `/login` och `/signup` visar ett formulär med fält för e-postadress och lösenord.
- Lösenordets synlighet kan växlas via en ikon i formuläret.
- Formuläret på `/login` har en knapp med texten "Logga in" (eller motsvarande) och formuläret på `/signup` har en knapp med texten "Registrera dig" (eller motsvarande).
- Vid inskickning skrivs e-postadress och lösenord ut i konsolen, utan att någon faktisk autentisering sker.
- Användaren kan växla mellan inloggnings- och registreringsläget utan att ladda om sidan i onödan, och det tydliga målet (logga in eller registrera sig) framgår alltid av gränssnittet.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Ska formulärvalidering (t.ex. giltig e-postadress, minsta lösenordslängd) ingå i denna specifikation, eller hanteras senare? ja en lätt validering.
- Ska växling mellan inloggning och registrering ske via navigering mellan `/login` och `/signup`, eller via ett läge som växlas inom samma formulär utan sidbyte? inom samma formulär.
- Ska felmeddelanden visas för användaren vid ogiltig inmatning, eller är det utanför scope för denna specifikation? ja

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att formuläret på `/login` och `/signup` renderar fälten för e-postadress och lösenord samt rätt knapptext.
- Att lösenordets synlighet växlar korrekt när ikonen klickas.
- Att växling mellan inloggnings- och registreringsläget fungerar och visar rätt formulär.
