# Specifikation för create-heist-formular

Branch: `claude/feature/create-heist-formular`

Figma-komponent (om den används): `Ej tillämpligt`

---

## Sammanfattning

Formuläret på `/heists/create` (`app/(dashboard)/heists/create/page.tsx`) är idag bara en platshållarrubrik och ska bli funktionellt. En inloggad användare ska kunna skapa en ny heist och tilldela den till en kollega. Vid sparande skapas ett nytt heist-dokument i Firestores `heists`-collection, där skaparens uppgifter sätts automatiskt utifrån den inloggade användaren och tilldelningen väljs bland andra användare i systemet (hämtade från en `users`-collection, som ger kodnamn och user-id). `deadline` sätts automatiskt till 48 timmar framåt och `finalStatus` till `null`. Efter en lyckad sparning omdirigeras användaren till `/heists`.

---

## Funktionella krav

- Formuläret ska innehålla fält för de uppgifter en användare faktiskt fyller i vid skapande av en heist: titel, beskrivning, och vem heisten ska tilldelas.
- Användaren ska kunna välja vem heisten tilldelas bland existerande användare i systemet, hämtade från `users`-collection (kodnamn + user-id).
- Uppgifterna om vem som skapat heisten (skaparens user-id och kodnamn) ska sättas automatiskt utifrån den inloggade användaren, utan att behöva fyllas i manuellt.
- Vid sparande ska ett nytt heist-dokument skapas i Firestores `heists`-collection.
- `deadline` ska sättas automatiskt (48 timmar från skapandetillfället) utan att användaren behöver ange det.
- `finalStatus` ska sättas till `null` vid skapande.
- Efter en lyckad sparning ska användaren omdirigeras till `/heists`.
- Om sparningen misslyckas ska användaren få tydlig återkoppling och kvarstå på formuläret utan att förlora redan ifylld data.

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** Ej tillämpligt
- **Komponentnamn:** Ej tillämpligt
- **Viktiga visuella krav:** Ej tillämpligt

---

## Möjliga specialfall (Edge Cases)

- Användaren skickar in formuläret med obligatoriska fält tomma.
- Det finns inga andra användare att tilldela heisten till (t.ex. en ny eller tom `users`-collection).
- Användaren försöker tilldela heisten till sig själv.
- Skrivningen till Firestore misslyckas (t.ex. nätverksfel eller behörighetsfel).
- Användaren navigerar bort från sidan innan sparandet hunnit slutföras.
- Användaren skickar in formuläret flera gånger snabbt efter varandra (t.ex. dubbelklick på skicka-knappen).

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- Formuläret på `/heists/create` innehåller fält för titel, beskrivning och val av vem heisten tilldelas.
- Listan över vilka heisten kan tilldelas hämtas från `users`-collection och visar användarnas kodnamn.
- Vid godkänd inskickning skapas ett nytt dokument i `heists`-collection med korrekt ifyllda fält (titel, beskrivning, skapare, tilldelad person), samt automatiskt satt `deadline` (48 timmar framåt) och `finalStatus` satt till `null`.
- Skaparens uppgifter sätts alltid utifrån den inloggade användaren, aldrig manuellt via formuläret.
- Efter en lyckad sparning navigeras användaren till `/heists`.
- Vid en misslyckad sparning visas ett felmeddelande och formulärets ifyllda data finns kvar.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Finns det redan en `users`-collection i Firestore med kodnamn och user-id:n, eller behöver den — och hur/när den fylls på — definieras som en del av detta arbete?
- Ska en användare kunna tilldela en heist till sig själv, eller ska det förhindras?
- Ska titel och beskrivning ha någon validering (t.ex. obligatoriska fält, maxlängd), eller räcker det att fälten inte är tomma?
- Ska listan över tilldelningsbara användare visa alla registrerade användare, eller finns det någon avgränsning (t.ex. exkludera den inloggade användaren själv)?
- Det befintliga heist-schemat har inget `createdAt`-fält, bara `deadline`. Ska ett `createdAt`-fält läggas till (för att t.ex. sortera eller visa när heisten skapades), eller räcker `deadline` ensamt?

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att formuläret renderar fälten för titel, beskrivning och tilldelning.
- Att listan över tilldelningsbara användare hämtas från `users`-collection och visar kodnamn.
- Att en godkänd inskickning skapar ett heist-dokument med korrekt ifyllda fält, samt automatiskt satt `deadline` och `finalStatus` satt till `null`.
- Att användaren omdirigeras till `/heists` efter en lyckad sparning.
- Att ett misslyckat sparningsförsök visar ett felmeddelande utan att tömma formuläret.
