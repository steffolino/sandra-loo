# Data Import Strategy – Sandra Loo

> **Rule**: No toilet data is ever hardcoded. All data flows through these
> import scripts. If real data is not available, the app shows an empty state.

---

## Overview

| Script                         | Source                        | Output file              |
| ------------------------------ | ----------------------------- | ------------------------ |
| `scripts/import/osm.ts`        | OpenStreetMap (Overpass API)  | `data/imports/osm.json`  |
| `scripts/import/institutional.ts` | OSM-derived public institutions | `data/imports/institutional.json` |
| `scripts/import/leipzig.ts`    | Leipzig Open Data (CKAN)      | `data/imports/leipzig.json` |
| `scripts/import/leipzig-institutional.ts` | Leipzig Open Data (joined hours + coordinates) | `data/imports/leipzig-institutional.json` |
| `scripts/import/leipzig-civic.ts` | Leipzig Open Data (polling-place geodata, experimental) | `data/imports/leipzig-civic.json` |
| `scripts/import/frankfurt.ts`  | Frankfurt am Main Open Data   | `data/imports/frankfurt.json` |

The public UI is now trait-first:

- users see `Free`, `Paid`, `Accessible`, `Hours shown`, and place-type markers
- source provenance remains in the data model for maintenance and debugging
- source-kind filters are no longer part of the main public map experience
- public toilets are not assumed to be clean or in perfect working order; we want user reports and confirmations to help track toilet state over time
- institutional places are treated as suggestions only and must not be presented as guaranteed free, open, or toilet-ready locations; if you’re unsure, check with the people on site

The Leipzig civic polling-place layer remains an experimental sidecar for
analysis and admin use. It is not part of the default merged toilet feed unless
we later prove verified toilet access and opening hours.

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

## 2. Institutional Layer (OSM-derived)

### Purpose
This layer derives candidate toilet locations from public-facing institutions where
toilet access is plausible during normal opening hours. It is intentionally
separate from explicit toilet POIs so the data pipeline can keep it distinct.
The public map now presents these places through user-facing traits, not source labels.

### Included building types
- `amenity=townhall`
- `amenity=library`
- `amenity=university`
- `amenity=college`
- `amenity=community_centre`
- `amenity=arts_centre`
- `amenity=theatre`
- `amenity=cinema`
- `amenity=museum`
- `amenity=swimming_pool`
- `amenity=public_bath`
- `amenity=bus_station`
- `amenity=ferry_terminal`
- `amenity=train_station`
- `amenity=post_office`
- selected public buildings with `building=civic|government|public` and explicit opening hours

### Current gaps

The institutional layer is still incomplete. Next priority items:

- better university coverage, especially main buildings and student service centers
- city halls / service centers with clear public lobby access
- museums, libraries, and cultural venues with verified public toilets
- transit hubs with publicly accessible toilets and opening-hour data

### Output rules
- Keep only records with a usable `opening_hours` value
- Preserve the original OSM object URL in `source`
- Mark the layer clearly in `source_name`
- Let users filter it via `source_kind=institutional`
- Phrase all public-facing copy carefully: these are suggested destinations, not guaranteed public toilets, and opening hours do not guarantee free toilet access; if you’re unsure, check with the people on site

The last point is mainly for internal maintenance and API consumers; the public map should continue to focus on place traits rather than source categories.

### Update frequency
Weekly, together with the main OSM import

---

## 3. Leipzig Open Data

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

## 4. Leipzig Institutional Join

### Purpose
This is the first official-source institutional import. It combines two Leipzig
Open Data resources into one building layer:

- `Kontaktdaten und Öffnungszeiten der Bibliotheken`
- `Geo-Koordinaten der Bibliotheken`

The importer keeps only rows that have both coordinates and opening hours.

### Why this pattern matters
This is the repeatable approach we should use for other cities:

1. find one dataset with opening hours or contact details
2. find one dataset with coordinates or another stable location field
3. join on a stable name or ID
4. keep only rows with both location and hours
5. expose the result as a separate layer that users can disable

### Inputs
- **Contacts / hours CSV**: `https://opendata.leipzig.de/dataset/62cdd44d-a98b-4666-8e87-e5cd7d8c1a44/resource/6000018a-2007-4f29-b62a-b41b9c211ff2/download/bibliothekenkontaktdaten.csv`
- **Coordinates CSV**: `https://opendata.leipzig.de/dataset/2a43ed7d-5e0a-4cf3-ac06-1f601b4f6c3b/resource/c3304312-0dd8-4b12-99ee-524737aeef0c/download/bibliothekengeodaten.csv`

### Running

```bash
npm run import:leipzig-institutional
```

### Output rules
- `type` is `library`
- `source_name` is `Leipzig Open Data – Libraries`
- opening hours are preserved in a compact human-readable form
- `notes` explain that the record is a joined official-source building candidate

### ID Format
`leipzig-institutional-{index}`

---

## 5. Leipzig Civic Buildings

### Purpose
This layer uses Leipzig's official polling-place geodata as a separate civic
building source. It is not a toilet dataset, and it should stay outside the
default public toilet feed unless we can verify actual toilet access and
opening hours. It is currently best treated as an experimental/admin sidecar.
Do not present it as a guaranteed toilet location.

### Inputs
- **Shapefile**: `https://opendata.leipzig.de/dataset/72f1f5fc-dad9-44a2-b3a8-67b3fad88abd/resource/c9b77a0e-b0ac-4eed-8a3e-803c31309ffe/download/wahllokale_2025.zip`
- **CSV**: `https://opendata.leipzig.de/dataset/72f1f5fc-dad9-44a2-b3a8-67b3fad88abd/resource/0316b420-dcec-49e1-a635-4b05764351a4/download/wbz_bundestag_mit_wahlobj.csv`

### Why it helps
This is the kind of source we should look for in other cities when an open-data
portal does not publish toilet hours directly:

1. a geodata layer with coordinates
2. a companion table with accessibility or building-use details
3. a stable building label that can be classified into a user-facing type
4. a separate layer users can switch off

### Output rules
- `type` is inferred from the building label
- `is_accessible` uses the official barrierefrei flag when available
- `opening_hours` remains empty because this source does not publish hours
- `notes` make clear that regular toilet access is not verified

### ID Format
`leipzig-civic-{index}`

---

## 6. Frankfurt am Main Open Data

### Source
- **Portal**: https://offenedaten.frankfurt.de
- **Dataset**: Öffentliche Toiletten Frankfurt am Main
- **Format**: GeoJSON or WFS
- **License**: dl-de/by-2-0

### Finding the WFS/GeoJSON URL

1. Go to https://offenedaten.frankfurt.de
2. Search for "Toiletten" or "WC"
3. Copy the GeoJSON download URL or WFS endpoint

Status note:

- the official metadata record for `Öffentliche Toiletten Frankfurt am Main` is confirmed
- the advertised WFS endpoint still needs a working public download path before the importer can use it directly
- `Kulturelle Einrichtungen Frankfurt am Main` and `Points of Interest Frankfurt am Main` are also confirmed in the GeoNetwork catalog, but the public WFS/download path still needs to be pinned down
- until then, do not treat any fallback dataset as official Frankfurt open data

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
| Institutional | Weekly             | Re-run `npm run import:institutional` |
| Leipzig    | Monthly               | Re-run `npm run import:leipzig` |
| Leipzig institutional | Monthly      | Re-run `npm run import:leipzig-institutional` |
| Leipzig civic (experimental) | On demand          | Re-run `npm run import:leipzig-civic` only for analysis |
| Frankfurt  | Monthly               | Re-run `npm run import:frankfurt`|

Planned next import work:

- expand Leipzig with more institutional datasets beyond libraries
- add university buildings and other public institutions as explicit, verifiable candidate POIs
- use the Leipzig join pattern for future city open-data catalogs that expose hours + coordinates separately
- use the Leipzig civic pattern only when the public-use signal is strong enough and the records will not be exposed as toilet destinations by default
- finish the Frankfurt official geodata connector once the live feed URL is confirmed

For production, consider setting up a scheduled GitHub Actions workflow.

---

## Deduplication

Each import file still uses deterministic source IDs (`osm-*`, `leipzig-*`,
`frankfurt-*`) so repeated imports do not duplicate records inside one source.

In addition, API serving now performs cross-source deduplication before records
reach the UI:

- filters records to Germany bounding-box coordinates
- detects likely duplicates in the same city by short geospatial distance
  (around <= 80m) plus name/address similarity
- merges duplicates into one canonical record (preferring city open-data over
  fallback/OSM where available)

This prevents duplicate map markers and duplicate toilet detail entries when
the same physical toilet exists in multiple source imports.

---

## Empty State Behavior

If no JSON files exist in `data/imports/`, all API responses return empty
arrays and the UI displays empty states with import instructions. The app
**never fabricates data**.
