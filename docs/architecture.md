# Architecture – Sandra Loo

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        PWA Client                           │
│   Nuxt 4 + Vue 3 + Tailwind CSS + Pinia                     │
│   Pages: /toilets, /game, /admin                            │
└─────────────┬──────────────────────────┬────────────────────┘
              │ useFetch / $fetch         │
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────────┐
│  Nuxt Server Routes │     │        External APIs            │
│  (Nitro)            │     │  - Overpass API (OSM)           │
│  /api/toilets       │     │  - Leipzig Open Data            │
│  /api/reviews       │     │  - Frankfurt Open Data          │
│  /api/reports       │     └─────────────────────────────────┘
│  /api/confirmations │              ▲
│  /api/leaderboard   │              │ import scripts
│  /api/game/config   │              │ (run manually / CI)
└─────────┬───────────┘              │
          │                          │
          ▼                          ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│  Data Store         │  │  data/imports/                      │
│  (MVP: JSON files)  │◄─│  osm.json                           │
│  (Prod: SQLite/PG)  │  │  leipzig.json                       │
└─────────────────────┘  │  frankfurt.json                     │
                         └─────────────────────────────────────┘
```

---

## Layers

### Frontend (`app/`)

- **Pages**: Route-level components under `app/pages/`
- **Layouts**: `default.vue` wraps all pages with nav + footer
- **Components**: organized by domain (`toilet/`, `game/`, `ui/`)
- **Composables**: `useGame.ts` encapsulates all game state logic
- **Stores**: Pinia stores for cross-component state (future auth, preferences)

### API (`server/api/`)

- Built on Nitro (Nuxt's server engine)
- Each file maps to one HTTP verb + path
- All handlers use shared types from `shared/types/`
- Input validation is inline; replace with Zod for production

### Data Layer (`server/utils/store.ts`)

- **MVP**: reads toilet data from JSON files in `data/imports/`
- Reviews, reports, confirmations, and scores are in-memory for MVP
- Replace with a real DB adapter for production persistence

### Shared Types (`shared/types/index.ts`)

- Single source of truth for all data types
- Used by both server routes and frontend components

### Import Scripts (`scripts/import/`)

- Standalone TypeScript scripts run with `tsx`
- Each script fetches, normalizes, and writes JSON to `data/imports/`
- See `docs/import-strategy.md` for full details

---

## Security Considerations (MVP)

- All user inputs are validated before storage
- No secrets in source code; all config via `.env`
- Auth is anonymous-by-default in MVP; full auth planned for post-MVP
- No SQL injection risk in MVP (JSON file store); add parameterized queries for DB

---

## Deployment

The app can be deployed as:

1. **Node.js server**: `npm run build && node .output/server/index.mjs`
2. **Static site**: `npm run generate` (limited server features)
3. **Edge / Vercel / Netlify**: Nitro adapters available
