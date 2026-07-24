# Specifikation för heist-card

Branch: `claude/feature/heist-card`

Figma-komponent (om den används): `Heist Card` (Active Heists / Assigned Heists-korten i dashboardvyn, `public/figmadesign1.jpg`)

---

## Sammanfattning

Heist Card är en komponent som visar en sammanfattning av ett enskilt uppdrag ("heist") i kortform. Den ska ersätta dagens rena textlista på `/heists` för aktiva och tilldelade uppdrag med ett visuellt rutnät av kort, där varje kort ger en snabb överblick av uppdraget och länkar vidare till detaljsidan. Till komponenten hör även en Heist Card Skeleton som visas i samma layout medan uppdragen hämtas, så att sidan inte hoppar när riktig data ersätter laddningstillståndet.

---

## Funktionella krav

- HeistCard visar för ett enskilt uppdrag: titel, vem uppdraget är tilldelat (mottagarens kodnamn), vem som skapat uppdraget (skaparens kodnamn), samt deadline/tidsstatus (t.ex. hur lång tid som återstår eller att uppdraget är försenat).
- Korttitelns text är en länk till uppdragets detaljsida (`/heists/:id`). Detaljsidan får inget nytt innehåll som en del av detta arbete.
- HeistCard visas i ett rutnät med tre kolumner på `/heists`, för aktiva uppdrag och uppdrag användaren själv tilldelat andra — inte för utgångna uppdrag.
- HeistCardSkeleton visar en laddningsplatshållare med samma yttre dimensioner, padding och position i rutnätet som ett riktigt HeistCard, och visas medan uppdragsdata fortfarande hämtas.
- Den visuella stilen (färger, typografi, spacing, ikoner, rundade hörn) baseras på designreferensen och ska kännas som en naturlig del av projektets etablerade designspråk (landing page, Navbar, Avatar, befintligt skeleton-mönster).
- Rutnätet är responsivt och anpassar antal kolumner efter skärmstorlek, med tre kolumner som målet på desktop.
- Statusinformation som "försenat uppdrag" förmedlas alltid med text, inte enbart med färg.

---

## Figma-referens (endast om en Figma-design används)

- **Fil:** `public/figmadesign1.jpg`
- **Komponentnamn:** Heist Card (kortmönstret i "Active Heists"/"Assigned Heists"-sektionerna av dashboardvyn)
- **Viktiga visuella krav:**
  - Mörk panelyta som visuellt sticker ut från den mörkare sidbakgrunden, med rundade hörn och generös inre padding.
  - Korttitel i vit, fet text, med utrymme för att radbryta till max två rader.
  - En rad som visar mottagarens kodnamn ("To:") och en rad som visar skaparens kodnamn ("By:"), båda föregångna av en liten personikon, med kodnamnet i en accentfärg som skiljer sig från övrig text.
  - En datumrad med kalenderikon, samt en tidsstatus-text (t.ex. återstående tid eller "Overdue") i samma accentfärg som kodnamnen.
  - En klockikon placerad i kortets övre högra hörn som statusindikator.
  - Ingen skugga eller gradient på själva kortytan — gradienter är i projektet reserverade för primära handlingsknappar.
  - Inget hover-tillstånd går att avläsa direkt från designbilden, men korttitelns länk ska ha ett tydligt, synligt fokusläge för tangentbordsnavigering.
  - Designbilden visar bara två exempelkort per sektion (på grund av lågt antal testdata), men rutnätet ska byggas för tre kolumner enligt de funktionella kraven ovan.

---

## Möjliga specialfall (Edge Cases)

- Ett uppdrag saknar tilldelad person eller skapare i visningen — ett rimligt fallback-värde visas istället för tomt utrymme.
- Mycket långa titlar bryts till max två rader utan att förstöra kortets eller rutnätets layout.
- Ett uppdrags deadline har precis passerat men uppdraget har ännu inte flyttats till "utgångna uppdrag" — tidsstatusen ska då tydligt visa att uppdraget är försenat.
- Det finns inga aktiva eller tilldelade uppdrag att visa — det tomma tillståndet hanteras av listan/sidan som omger korten, inte av HeistCard-komponenten själv.
- Ett fel uppstår vid hämtning av uppdragsdata — detta hanteras på listnivå, inte av det enskilda kortet.
- Antalet uppdrag fyller inte en hel rad i rutnätet (t.ex. ett eller två kort) — layouten ska fortfarande se korrekt ut utan att korten sträcks ut onaturligt.
- Flera skelettkort visas samtidigt i samma rutnät under laddning, i samma antal kolumner som de riktiga korten kommer att använda.

---

## Acceptanskriterier

Funktionen anses vara klar när följande är uppfyllt:

- HeistCard visar titel, mottagarens kodnamn, skaparens kodnamn och deadline/tidsstatus för ett uppdrag.
- Korttitelns text länkar till `/heists/:id` för rätt uppdrag.
- På `/heists` visas HeistCard i ett rutnät med tre kolumner för aktiva och tilldelade uppdrag, men inte för utgångna uppdrag.
- HeistCardSkeleton visas i samma rutnätslayout och med samma yttre dimensioner som HeistCard medan uppdrag laddas.
- Den visuella stilen matchar designreferensen och är konsekvent med projektets befintliga designtokens och komponentmönster.
- Rutnätet är responsivt och fungerar på mobil, surfplatta och desktop, med tre kolumner som målet på desktop.
- Korttitelns länk har ett synligt fokusläge och kan nås och aktiveras via tangentbord.
- Tidsstatus (t.ex. "försenat uppdrag") förmedlas med text, inte enbart med färg.
- Dekorativa ikoner är dolda för skärmläsare.

---

## Öppna frågor

Lista sådant som behöver förtydligas innan implementationen påbörjas.

- Ska mottagarens och skaparens kodnamn visas med en avatar (t.ex. den befintliga Avatar-komponenten), eller enbart som text med en personikon, i linje med designbilden?text med person icon.
- Ska HeistCard någonsin behöva visa uppdrag med ett slutgiltigt resultat (lyckat/misslyckat), eller är det helt utanför denna komponents scope eftersom designbilden bara visar detta i en separat historik-lista? inte just nu.
- Vilken exakt panelfärg ska kortytan ha, givet att designbilden är en komprimerad exportbild där exakta färgvärden inte går att fastställa med säkerhet? om det inte finns en liknande i globala färgerna så får du lägg atill en som är nära det som visars i bilden.
- Ska hela kortet ha ett hover-tillstånd, eller är det bara korttitelns länk som ska reagera visuellt vid hover/fokus? bara titellänken.
- Vid vilken skärmbredd ska rutnätet växla mellan en, två och tre kolumner?
  mobile view 1 kolumn, tablett view 2 kolumner , desktop 3 kolumner.

---

## Riktlinjer för testning

Skapa testfiler i mappen `./tests` för den nya funktionen.

Skriv meningsfulla tester för de viktigaste scenarierna, utan att göra testsviten onödigt omfattande.

Testerna bör bland annat verifiera:

- Att HeistCard visar rätt titel, mottagarkodnamn, skaparkodnamn och tidsstatus för ett givet uppdrag.
- Att korttitelns länk pekar till rätt `/heists/:id`-URL för uppdraget.
- Att HeistCardSkeleton renderar ett laddningstillstånd utan att kräva någon uppdragsdata.
- Att `/heists`-sidan visar HeistCard-kort för aktiva och tilldelade uppdrag, men inte för utgångna uppdrag.
- Att `/heists`-sidan visar HeistCardSkeleton i rutnätet medan uppdragsdata fortfarande laddas.
