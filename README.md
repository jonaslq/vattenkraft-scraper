# Vattenkraftstationer Scraper

Detta projekt är en Node.js-applikation som skrapar data från Vattenfalls webbplats om vattenkraftstationer. Applikationen hämtar information om olika vattenkraftstationer, använder OCR för att läsa av bilddata och exponerar informationen via en RESTful API.

## Innehållsförteckning

- [Funktioner](#funktioner)
- [Förkrav](#förkrav)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Användning](#användning)
  - [Köra med Node.js](#köra-med-nodejs)
  - [Köra med Docker](#köra-med-docker)
- [API](#api)
- [Projektstruktur](#projektstruktur)
- [Beroenden](#beroenden)
- [Licens](#licens)

## Funktioner

- **Skrapar data** om vattenkraftstationer från Vattenfalls webbplats.
- **Använder OCR** (Tesseract.js) för att läsa av bilddata.
- **Exponerar en RESTful API** för att hämta den skrapade datan.
- **Schemaläggning** av skrapningsprocessen med anpassningsbara intervall.
- **Loggning** med tidsstämplar och valbart debug-läge för detaljerad felsökning.
- **Docker-stöd** för enkel distribution och körning i container-miljöer.

## Förkrav

- **Docker** (för att köra applikationen med Docker)
- **Node.js** (om du vill köra applikationen utan Docker)
- **npm** (Node Package Manager, om du vill köra applikationen utan Docker)

## Installation

### Om du använder Docker

Ingen installation krävs för applikationen, men du behöver ha Docker installerat på din maskin.

### Om du inte använder Docker

1. **Klona detta repository:**

   ```bash
   git clone https://github.com/ditt-användarnamn/vattenkraft-scraper.git
   cd vattenkraft-scraper
   ```

2. **Installera beroenden:**

   ```bash
   npm install
   ```

## Konfiguration

Applikationen kan konfigureras med följande miljövariabler:

- `SCRAPING_INTERVAL`: Anger intervallet för skrapning i timmar. Standardvärde är `2` timmar.
- `DEBUG_MODE`: Aktiverar debug-loggning när satt till `true`. Standardvärde är `false`.

### Använda miljövariabler med Docker

När du kör applikationen med Docker kan du skicka miljövariablerna med flaggan `-e` i kommandot `docker run`.

**Exempel:**

```bash
docker run -e SCRAPING_INTERVAL=4 -e DEBUG_MODE=true -p 3080:3080 ditt-användarnamn/vattenkraft-scraper
```

## Användning

### Köra med Node.js

1. **Starta applikationen:**

   ```bash
   node index.js
   ```

2. **Ange miljövariabler vid körning (valfritt):**

   ```bash
   SCRAPING_INTERVAL=3 DEBUG_MODE=true node index.js
   ```

### Köra med Docker

1. **Bygg Docker-bilden:**

   Klona repositoryt om du inte redan har gjort det och navigera till projektets rotkatalog.

   ```bash
   git clone https://github.com/ditt-användarnamn/vattenkraft-scraper.git
   cd vattenkraft-scraper
   ```

   Bygg bilden med följande kommando:

   ```bash
   docker build -t vattenkraft-scraper .
   ```

2. **Kör Docker-kontainern:**

   ```bash
   docker run -p 3080:3080 vattenkraft-scraper
   ```

   Detta startar applikationen i en Docker-kontainer och exponerar port `3080` på din lokala maskin.

3. **Ange miljövariabler (valfritt):**

   ```bash
   docker run -e SCRAPING_INTERVAL=4 -e DEBUG_MODE=true -p 3080:3080 vattenkraft-scraper
   ```

4. **Kör i bakgrunden (valfritt):**

   ```bash
   docker run -d -p 3080:3080 vattenkraft-scraper
   ```

5. **Kontrollera att kontainern körs:**

   ```bash
   docker ps
   ```

6. **Stoppa kontainern:**

   Hitta kontainer-ID med `docker ps` och stoppa den med:

   ```bash
   docker stop <container-id>
   ```

**Notera:** Om du vill använda en `.env`-fil för att hantera miljövariabler i Docker, kan du kopiera `.env`-filen till kontainern och använda den. Ändra din `Dockerfile` enligt följande:

```dockerfile
# Kopiera .env-filen
COPY .env .env
```

Och uppdatera `index.js` för att använda `dotenv`:

```javascript
require('dotenv').config();
```

Sedan kan du bygga om Docker-bilden och köra kontainern utan att behöva ange miljövariabler vid körning.

## API

### GET `/api/vattenkraftstationer`

Returnerar en lista över vattenkraftstationer med deras fakta och vatteninformation.

**Exempel på svar:**

```json
[
  {
    "fakta": {
      "namn": "Stornorrfors",
      "land": "Sverige",
      "elektriskEffekt": 599,
      "vattendrag": "Ume älv",
      "fallhojd": 75,
      "vattenforing": 975,
      "turbintyp": "Francis",
      "agarandel": 100,
      "driftStatus": true
    },
    "vatteninformation": {
      "ovanDamm": 42.99,
      "underDamm": 10.72,
      "totalt": 5373,
      "genomTurbin": 5373,
      "genomDammLucka": 3,
      "senasteUppdatering": "2024-09-23T17:25:00+02:00"
    }
  },
  {
    "fakta": {
      "namn": "Forsmo",
      "land": "Sverige",
      "elektriskEffekt": 50,
      "vattendrag": "Ångermanälven",
      "fallhojd": 35,
      "vattenforing": 150,
      "turbintyp": "Kaplan",
      "agarandel": 100,
      "driftStatus": true
    },
    "vatteninformation": {
      "ovanDamm": 75.3,
      "underDamm": 74.2,
      "totalt": 300,
      "genomTurbin": 290,
      "genomDammLucka": 10,
      "senasteUppdatering": "2024-09-23T18:20:00+02:00"
    }
  }
]
```

## Projektstruktur

- **`index.js`**: Huvudfilen som startar servern och hanterar schemaläggningen.
- **`scraper.js`**: Innehåller funktioner för att hämta URL:er till vattenkraftstationerna.
- **`stationScraper.js`**: Hanterar skrapning av individuella stationer och OCR-behandling.
- **`logger.js`**: Hanterar loggning och debug-utskrifter.
- **`Dockerfile`**: Konfigurationsfil för att bygga Docker-bilden.
- **`package.json`**: Projektets beroenden och skript.
- **`README.md`**: Dokumentation av projektet.

## Beroenden

- **axios**: För HTTP-förfrågningar.
- **cheerio**: För att parsa och traversera HTML.
- **express**: För att skapa en webbserver och API-endpoints.
- **node-cron**: För schemaläggning av återkommande uppgifter.
- **tesseract.js**: För OCR-behandling av bilder.
- **luxon**: För datum- och tidsbehandling.
- **dotenv** (valfritt): För att hantera miljövariabler via en `.env`-fil.

## Licens

Detta projekt är licensierat under **MIT-licensen**.

---

Om du har några frågor eller behöver ytterligare hjälp, tveka inte att kontakta projektägaren.
