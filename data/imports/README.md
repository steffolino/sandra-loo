# data/imports/

This directory stores JSON files imported by the data import scripts.

## Files

| File              | Source                  | Script                        |
| ----------------- | ----------------------- | ----------------------------- |
| `osm.json`        | OpenStreetMap           | `npm run import:osm`          |
| `institutional.json` | OSM-derived institutional layer | `npm run import:institutional` |
| `leipzig.json`    | Leipzig Open Data       | `npm run import:leipzig`      |
| `frankfurt.json`  | Frankfurt Open Data     | `npm run import:frankfurt`    |

## Important

- These files are **gitignored** to prevent accidental commit of large datasets
- Run the import scripts to generate them locally
- See `docs/import-strategy.md` for instructions
