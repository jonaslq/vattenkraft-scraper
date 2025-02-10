# Scraping Context

The scraper handles:

- Station basic information
- Water flow measurements
- Timestamps from images
- Multiple language support (Swedish/English)

Data structure:

```javascript
{
  fakta: {
    namn: string,
    land: string,
    elektriskEffekt: string,
    vattendrag: string
  },
  vatteninformation: {
    senasteUppdatering: string,
    ovanDamm: number,
    underDamm: number,
    totalt: number,
    genomTurbin: number,
    genomDammLucka: number
  }
}
```
