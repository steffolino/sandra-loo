# Data Import Strategy – Sandra Loo

> **Rule**: No toilet data is ever hardcoded. All data flows through these
> import scripts. If real data is not available, the app shows an empty state.

---

## Overview

| Script                         | Source                        | Output file              |
| ------------------------------ | ----------------------------- | ------------------------ |
| `scripts/import/osm.ts`        | OpenStreetMap (Overpass API)  | `data/imports/osm.json`  |
| `scripts/import/leipzig.ts`    | Leipzig Open Data (CKAN)      | `data/imports/leipzig.json` |
| `scripts/import/frankfurt.ts`  | Frankfurt am Main Open Data   | `data/imports/frankfurt.json` |

---

## 1. OpenStreetMap (OSM)

### Source
- **URL**: https://www.openstreetmap.org
- **API**: [Overpass API](https://overpass-api.de)
- **License**: ODbL – attribution required

### Query

The script queries for `amenity=toilets` nodes and ways within the
administrative boundary of each city:

```
[out:json][timeout:30];
area["name"="Leipzig"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
  way["amenity"="toilets"](area.searchArea);
);
out center tags;
```

### Running

```bash
npm run import:osm
# Custom cities:
CITIES="Leipzig,Frankfurt am Main,Dresden" npm run import:osm
```

### Normalization Rules

| OSM tag          | Sandra Loo field | Notes                         |
| ---------------- | ---------------- | ----------------------------- |
| `name`           | `name`           | Falls back to `name:de`       |
| `amenity`        | `type`           | Always `public`               |
| `addr:street`    | `address`        | Combined with housenumber     |
| `wheelchair`     | `is_accessible`  | `yes` or `designated` = true  |
| `fee`            | `is_free`        | `yes` = paid → `false`        |
| `opening_hours`  | `opening_hours`  | OSM format preserved          |

### ID Format
`osm-node-{id}` or `osm-way-{id}`

---

## 2. Leipzig Open Data

### Source
- **Portal**: https://opendata.leipzig.de
- **Dataset**: Öffentliche Toiletten Leipzig
- **API**: CKAN Datastore API
- **License**: CC BY 4.0

### Finding the Resource ID

1. Go to https://opendata.leipzig.de/dataset/oeffentliche-toiletten
2. Click on the dataset resource
3. Copy the resource ID from the URL or API explorer

### Configuration

```bash
LEIPZIG_RESOURCE_ID=<your-resource-id>
npm run import:leipzig
```

### Normalization Rules

Field names vary by dataset version. The script attempts common variants:

| Likely field(s)              | Sandra Loo field | Notes                |
| ---------------------------- | ---------------- | -------------------- |
| `lat`, `latitude`, `y`       | `lat`            |                      |
| `lon`, `longitude`, `x`      | `lng`            |                      |
| `name`, `bezeichnung`        | `name`           |                      |
| `strasse` + `hausnummer`     | `address`        |                      |
| `rollstuhl`, `barrierefrei`  | `is_accessible`  |                      |
| `gebuehrenpflichtig`         | `is_free`        | Inverted             |
| `oeffnungszeiten`            | `opening_hours`  |                      |

**If the field mapping is wrong**: inspect the raw CKAN API response and
update `normalizeRow()` in `scripts/import/leipzig.ts`.

### ID Format
`leipzig-{_id}`

---

## 3. Frankfurt am Main Open Data

### Source
- **Portal**: https://offenedaten.frankfurt.de
- **Dataset**: Öffentliche Toiletten Frankfurt am Main
- **Format**: GeoJSON or WFS
- **License**: dl-de/by-2-0

### Finding the WFS/GeoJSON URL

1. Go to https://offenedaten.frankfurt.de
2. Search for "Toiletten" or "WC"
3. Copy the GeoJSON download URL or WFS endpoint

### Configuration

```bash
FRANKFURT_WFS_URL=<your-geojson-url>
npm run import:frankfurt
```

### Normalization Rules

| Likely GeoJSON property      | Sandra Loo field | Notes                |
| ---------------------------- | ---------------- | -------------------- |
| `geometry.coordinates[1]`    | `lat`            | GeoJSON is [lng, lat]|
| `geometry.coordinates[0]`    | `lng`            |                      |
| `name`, `bezeichnung`        | `name`           |                      |
| `strasse` + `hausnummer`     | `address`        |                      |
| `rollstuhl`, `barrierefrei`  | `is_accessible`  |                      |
| `kostenpflichtig`            | `is_free`        | Inverted             |
| `oeffnungszeiten`            | `opening_hours`  |                      |

### ID Format
`frankfurt-{feature.id or index}`

---

## Update Strategy

| Source     | Recommended frequency | Method                          |
| ---------- | --------------------- | ------------------------------- |
| OSM        | Weekly                | Re-run `npm run import:osm`     |
| Leipzig    | Monthly               | Re-run `npm run import:leipzig` |
| Frankfurt  | Monthly               | Re-run `npm run import:frankfurt`|

For production, consider setting up a scheduled GitHub Actions workflow.

---

## Deduplication

Each record has a deterministic ID based on its source and source record ID.
Re-running import scripts overwrites the output JSON, so there is no
accumulation of duplicates between runs.

Cross-source deduplication (same physical toilet in OSM and city data) is a
future enhancement tracked in `docs/backlog.md`.

---

## Empty State Behavior

If no JSON files exist in `data/imports/`, all API responses return empty
arrays and the UI displays empty states with import instructions. The app
**never fabricates data**.
