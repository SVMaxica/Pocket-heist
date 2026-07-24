---
description: Granskar ej committade kodändringar på den aktuella branchen.
allowed-tools: Bash(git diff), Bash(git diff --staged)
---

Din uppgift är att samordna två gransknings-subagenter parallellt:

- **a11y-reviewer**
- **code-quality-reviewer**

## Mål

1. Samla in diffen för den aktuella branchen, inklusive både staged och unstaged ändringar.
2. Kör båda gransknings-subagenterna parallellt på samma diff.
3. Slå samman deras återkoppling till en gemensam rapport och ta bort överlappande eller duplicerade synpunkter.
4. Skapa en föreslagen ändringsplan i form av en ordnad checklista för att åtgärda återkopplingen.
5. Be användaren om ett uttryckligt godkännande **innan** några kodändringar genomförs.

## Process

### 1. Samla in diffen

Hämta både unstaged och staged ändringar:

- Använd `git diff` för unstaged ändringar.
- Använd `git diff --staged` för staged ändringar.

Om båda kommandona returnerar tomma resultat ska du informera användaren om att det inte finns några ändringar att granska och sedan avbryta processen.

**Gå inte vidare om båda diffarna är tomma.**

### 2. Starta båda subagenterna parallellt

Starta följande subagenter samtidigt:

- `a11y-reviewer`
- `code-quality-reviewer`

Ge båda subagenterna:

- den sammanslagna diffen med både staged och unstaged ändringar
- kort projektkontext om det behövs, exempelvis:
  - teknikstack
  - lint-kommandon
  - testkommandon
  - relevanta kodstandarder

Instruera båda subagenterna att:

- endast granska kod som visas i diffen
- inte analysera, referera till eller föreslå ändringar i kod utanför diffen
- vara evidensbaserade
- ange exakta filsökvägar
- hänvisa till relevanta rader eller kodutdrag
- inte gissa när kontext saknas
- tydligt markera osäkerheter
- föredra lokala och proportionerliga lösningar framför omfattande omskrivningar

### 3. Slå samman resultaten

När båda subagenterna är klara ska du slå samman deras resultat till en gemensam rapport.

Ta bort eller slå ihop överlappande synpunkter så att samma problem inte rapporteras flera gånger.

Om båda agenterna identifierar samma problem från olika perspektiv ska du behålla den mest kompletta beskrivningen och vid behov kombinera deras motiveringar.

Rapporten ska följa denna struktur:

## 1. Sammanfattning

Ge en kort sammanfattning med maximalt åtta punkter totalt.

Sammanfattningen ska lyfta fram:

- de viktigaste problemen
- eventuell blockerande risk
- övergripande kodkvalitet
- övergripande tillgänglighet
- om ändringarna verkar redo att mergas efter justeringar

## 2. Tillgänglighetsproblem

Sortera fynden efter följande allvarlighetsgrader:

### Blockerande

Problem som gör viktig funktionalitet helt otillgänglig eller förhindrar användare med funktionsnedsättning från att slutföra en central uppgift.

### Stora

Problem som skapar betydande tillgänglighetshinder eller gör funktionaliteten mycket svår att använda.

### Mindre

Problem som skapar märkbar friktion men där det finns möjliga lösningar för användaren.

### Nit

Mindre förbättringar, rekommendationer eller bästa praxis som inte bör blockera merge.

För varje fynd ska du ange:

- titel
- allvarlighetsgrad
- fil
- relevanta rader eller kodutdrag
- tydlig beskrivning
- rekommenderad lösning
- användarpåverkan
- relevant WCAG-kriterium när det är tillämpligt

## 3. Kodkvalitetsproblem

Sortera fynden efter samma allvarlighetsgrader:

### Blockerande

Exempel:

- säkerhetsrisk
- dataförlust
- krasch
- allvarligt fel som blockerar central funktionalitet

### Stora

Exempel:

- sannolikt felaktigt beteende
- allvarlig brist i felhantering
- betydande typsäkerhetsproblem
- kod som sannolikt orsakar produktionsfel

### Mindre

Exempel:

- läsbarhetsproblem
- måttlig duplicering
- mindre robusthetsproblem
- lokala förbättringar av struktur eller namngivning

### Nit

Exempel:

- mindre kodförbättringar
- tydligare namn
- små förenklingar
- förbättringar som inte bör blockera merge

För varje fynd ska du ange:

- titel
- allvarlighetsgrad
- fil
- relevanta rader eller kodutdrag
- tydlig problembeskrivning
- rekommenderad lösning
- varför ändringen förbättrar koden

## 4. Gemensam åtgärdsplan

Skapa en ordnad checklista för att åtgärda återkopplingen.

Checklistan ska:

- börja med blockerande problem
- därefter ta stora, mindre och slutligen nit-problem
- slå ihop åtgärder som löser flera fynd samtidigt
- hålla sig till kod som ingår i diffen
- föredra små och lokala ändringar
- inte föreslå omfattande omskrivningar av resten av kodbasen
- tydligt markera sådant som bör hanteras som en separat framtida uppgift

Exempel:

```text
- [ ] 1. Lägg till ett tillgängligt namn på menyknappen i `...`
- [ ] 2. Koppla formulärets felmeddelande till inputfältet med `aria-describedby`
- [ ] 3. Hantera avvisade promises i `submitForm`
- [ ] 4. Förenkla den lokala villkorslogiken utan att ändra övriga moduler
```
