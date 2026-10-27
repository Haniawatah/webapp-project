# Sverige Tagförseningar (PWA)

Det här projektet uppfyller:

- Krav 1: Specifikation och arkitektur
- Krav 2: Karta och GPS
- Krav 3: Native design 
- Krav 4 (valfritt): Autentisering och favoritstationer


## Vad gör appen?

Appen visar försenade tåg i Sverige. Den hämtar data från två ställen på `trafik.emilfolino.se`:
- `GET /delayed` för försenade tåg
- `GET /stations` för stationsinformation

Jag kopplar ihop denna data med `LocationSignature` så man kan se både på en karta och i en lista var tågen är försenade. Appen är byggd med Vite, fungerar som en PWA (med egen ikon), och deployar sig själv till GitHub Pages när jag pushar.


## Hur är koden organiserad?

Jag gjorde en enkel struktur som är lätt att förstå och underhålla. Huvudfilerna är:

- `src/api.js` - all kommunikation med externa API:er
- `src/main.js` - gränssnitt och logik
- `src/cache.js` - lagring av data lokalt

I `api.js` gör jag om svaren till samma format så resten av appen inte behöver tänka på vilka API:er som användes. 

I `main.js` hanterar jag allt state: trafikdata, kartan, var användaren är, inloggning och favorittstationer.

Kartan görs med Leaflet och användarens position kommer från webbläsarens inbyggda geolocation. 

Inloggningen sker separat mot `auth.emilfolino.se` så att auth-koden inte blandas ihop med trafikdelen.

Deployningen görs med ett script i `.github/workflows/deploy.yml`.


## Hur sparar jag data?

Jag sparar på två sätt:

- Stationer i `localStorage` i 24 timmar (de ändras inte ofta)
- Förseningar i `localStorage` i 2 minuter (de ändras ofta)
- App-filer och trafikförfrågningar sparas i service worker-cachen

Anledningen är att stationer nästan aldrig ändras, men förseningar uppdateras ständigt. Så här är appen snabb utan att visa för gamla uppgifter.


## Vad kan appen göra?

- Visar försenade tåg på en karta med markörer på rätt station
- Klickar man på en markör ser man stationen och förseningen i minuter
- Förseningen räknas ut från skillnaden mellan `EstimatedTimeAtLocation` och `AdvertisedTimeAtLocation`
- Man kan se sin egen position på kartan (GPS)
- Det finns en lista med sökfunktion för stationer/tåg
- Man kan registrera sig och logga in med JWT
- Inloggade användare kan spara favoritstationer
- Det finns en favoritsida som visar en översikt över förseningar för sparade stationer
- Appen fungerar offline och har manifest och service worker


## Vad prioriterade jag?

Jag fokuserade på att få det att fungera ordentligt istället för att lägga tid på fina effekter.

Viktigast var att förbindelsen mellan stationer och förseningar blev rätt, att kartan alltid visar relevant info, och att login/favoriter var tillförlitligt med bra tokenhantering.

Jag valde också att hålla designen simpel och rakt fram istället för många animationer.


## Vad är inte perfekt?

- Om det är många förseningar samtidigt kan sidan bli långsam
- Att spara favoriter i auth-servicens `artefact`-fält fungerar men är inte så bra designmässigt
- Felmeddelanden från API:erna kan ibland vara svåra att förstå
- Appen visar inte var tågen är just nu, bara om de är försenade på stationen


## Saker som skulle vara enkla att lägga till

1. Gruppera markörer på kartan när det blir många (Leaflet marker clustering) för att det blir snabbare
2. Försök om och om igen om API-anropet misslyckas, så att tillfälliga nätproblem inte förstör allt
3. Spara senaste trafikdata i IndexedDB så att appen fungerar bättre offline
4. Bättre felmeddelanden och validering i login-formulären


## Kom igang lokalt

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```


## Konfiguration

Skapa `.env` (valfritt, appen har fallback-api-key):

```bash
VITE_API_KEY = din_api_nyckel
```


## Deployment

Workflow finns i `.github/workflows/deploy.yml` och bygger + deployar automatiskt till GitHub Pages vid push till `main` eller `master`.
# webapp-project
