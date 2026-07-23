# Specifikation för use-heists-hook

Branch: `claude/feature/use-heists-hook`

Figma-komponent (om den används): `Ej tillämpligt`

---

## Sammanfattning

En ny hook, `useHeists`, ska hämta heist-data i realtid från Firestore och returnera en array med heist-objekt. Hooken ska ta emot ett argument (`active`, `assigned` eller `expired`) som avgör vilken delmängd av heists som hämtas. Hooken ska användas på sidan `/heists` (`app/(dashboard)/heists/page.tsx`) för att visa titlarna på heists i de tre befintliga sektionerna (dina aktiva heists, heists du tilldelat andra, samt alla avslutade heists).

---

## Funktionella krav

- Hooken ska heta `useHeists` och ta emot ett argument som styr vilken uppsättning heists som hämtas: `active`, `assigned` eller `expired`.
- Vid `active`: hämta alla heists som är tilldelade den aktuella användaren och där deadline ännu inte har passerat.
- Vid `assigned`: hämta alla heists som har skapats av den aktuella användaren och där deadline ännu inte har passerat.
- Vid `expired`: hämta alla heists där deadline har passerat och där `finalStatus` inte längre är `null`, oavsett vilken användare som skapat eller tilldelats heisten.
- Hooken ska hämta data i realtid — listan ska uppdateras automatiskt när den underliggande datan i Firestore ändras, utan att sidan behöver laddas om.
- Hooken ska returnera en array med heist-objekt.
- Sidan `/heists` ska använda hooken för samtliga tre lägen och visa titlarna för respektive resultatmängd i rätt sektion (aktiva heists, tilldelade heists, avslutade heists).

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** Ej tillämpligt
- **Komponentnamn:** Ej tillämpligt
- **Viktiga visuella krav:** Ej tillämpligt

---

## Möjliga specialfall (Edge Cases)

- En resultatmängd är tom (t.ex. användaren har inga aktiva heists).
- Datan ändras i realtid medan användaren tittar på sidan (t.ex. en heist avslutas eller en ny skapas) — listan ska spegla ändringen utan omladdning.
- En heist vars deadline har passerat men vars `finalStatus` fortfarande är `null` — matchar varken definitionen för `active`/`assigned` (deadline har passerat) eller `expired` (`finalStatus` är fortfarande `null`).
- Flera heists har exakt samma deadline.
- Ett nätverks- eller behörighetsfel uppstår vid prenumerationen på Firestore-datan.
- Hooken används innan den aktuella användarens inloggningsstatus är helt känd.

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- `useHeists("active")` returnerar heists tilldelade den inloggade användaren där deadline inte har passerat.
- `useHeists("assigned")` returnerar heists skapade av den inloggade användaren där deadline inte har passerat.
- `useHeists("expired")` returnerar heists där deadline har passerat och `finalStatus` inte är `null`, oavsett användare.
- Listan som hooken returnerar uppdateras automatiskt när motsvarande data i Firestore ändras, utan sidladdning.
- Sidan `/heists` visar titlarna för respektive resultatmängd i rätt sektion.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Vad ska visas i en sektion när resultatmängden är tom? lägg en passande text tex inga heists.
- Ska något laddningstillstånd visas medan datan hämtas första gången, eller räcker en tom lista tills dess? en spinner använd klockiconen.
- Hur ska fel från Firestore-prenumerationen (t.ex. nätverks- eller behörighetsfel) hanteras och visas för användaren? vis aett felmeddelande.
- En heist vars deadline har passerat men vars `finalStatus` fortfarande är `null` hamnar utanför alla tre definitionerna ovan — ska den synas någonstans på sidan, eller är detta ett medvetet mellanläge som inte behöver hanteras av denna specifikation? den ska listas under all expired heists.
- Ska heists sorteras på något sätt inom varje resultatmängd (t.ex. efter deadline eller skapandedatum), eller är ordningen oviktig här? senaste först.

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att `useHeists("active")` returnerar rätt delmängd av heists.
- Att `useHeists("assigned")` returnerar rätt delmängd av heists.
- Att `useHeists("expired")` returnerar rätt delmängd av heists.
- Att listan uppdateras när den underliggande datan ändras (realtidsbeteende).
- Att `/heists`-sidan visar titlarna för respektive resultatmängd i rätt sektion.
