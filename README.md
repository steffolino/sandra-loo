# Sandra Loo 🚻

**Civic Toilet Finder + Awareness Game** — Nuxt 4 PWA for Germany (MVP)

> 🤖 **This project was primarily built using AI coding agents** (GitHub Copilot Agent).
> All code, architecture, and documentation were generated and refined through
> AI-assisted development. Human review and civic-data quality principles are applied
> throughout.

---

## What is Sandra Loo?

Sandra Loo is a mobile-first Progressive Web App that combines two modules:

1. **Civic Utility** — Find, review, and report on public toilets in German cities
2. **Awareness Game** — A stylized, run-based survival game from a female perspective

### MVP Cities

- Leipzig
- Frankfurt am Main

---

## Data Policy

> ⚠️ **This project handles real-world civic data. No fake data is ever generated.**

- All toilet locations come from **real, verifiable sources** (OpenStreetMap, city open-data portals)
- Data is imported via **scripts in `scripts/import/`** — never hardcoded
- Every record includes `source`, `source_name`, and `last_updated_at`
- If no data is imported: the app shows **empty states** — it never fabricates content

---

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Frontend   | Nuxt 4, Vue 3, TypeScript, Tailwind CSS |
| Mapping    | OpenStreetMap + Leaflet                 |
| Backend    | Nuxt server routes (Nitro)              |
| Database   | JSON files (MVP) → SQLite / Postgres    |
| PWA        | @vite-pwa/nuxt                          |
| State      | Pinia                                   |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
# Edit .env as needed
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Import real data

```bash
# Import from OpenStreetMap (Leipzig + Frankfurt am Main)
npm run import:osm

# Import from Leipzig Open Data (requires LEIPZIG_RESOURCE_ID)
npm run import:leipzig

# Import from Frankfurt am Main Open Data (requires FRANKFURT_WFS_URL)
npm run import:frankfurt
```

See [`docs/import-strategy.md`](docs/import-strategy.md) for full instructions.

### Build for production

```bash
npm run build
npm run preview
```

### Run tests

```bash
npm test
```

---

## Project Structure

```
/
├─ app/                    # Frontend (Vue 3 + Nuxt pages/components)
│  ├─ assets/css/
│  ├─ components/
│  │  ├─ game/
│  │  └─ toilet/
│  ├─ composables/
│  ├─ layouts/
│  └─ pages/
│     ├─ admin/
│     ├─ game/
│     └─ toilets/
├─ server/                 # API routes (Nitro)
│  ├─ api/
│  │  ├─ confirmations/
│  │  ├─ game/
│  │  ├─ leaderboard/
│  │  ├─ reports/
│  │  ├─ reviews/
│  │  └─ toilets/
│  └─ utils/
├─ shared/
│  └─ types/               # Shared TypeScript types
├─ scripts/
│  └─ import/              # Data import scripts
│     ├─ osm.ts
│     ├─ leipzig.ts
│     └─ frankfurt.ts
├─ data/
│  └─ imports/             # Imported JSON data snapshots (committed for Pages deploy)
├─ docs/                   # Documentation
├─ .github/                # Issue templates, PR template
├─ public/                 # Static assets
└─ tests/                  # Unit and API tests
```

---

## API Endpoints

| Method | Path                          | Description             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/toilets`                | List / filter toilets   |
| GET    | `/api/toilets/:id`            | Toilet detail           |
| POST   | `/api/reviews`                | Submit a review         |
| POST   | `/api/reports`                | Submit a report         |
| POST   | `/api/confirmations`          | Submit a confirmation   |
| GET    | `/api/leaderboard/daily`      | Daily leaderboard       |
| GET    | `/api/leaderboard/all-time`   | All-time leaderboard    |
| POST   | `/api/leaderboard/submit`     | Submit a game score     |
| GET    | `/api/game/config`            | Game configuration      |

---

## Documentation

| File                              | Description                    |
| --------------------------------- | ------------------------------ |
| `docs/product-mvp.md`             | Product scope and principles   |
| `docs/architecture.md`            | System architecture            |
| `docs/game-design.md`             | Game mechanics and design      |
| `docs/data-model.md`              | Data model reference           |
| `docs/api.md`                     | API reference                  |
| `docs/import-strategy.md`         | Data import instructions       |
| `docs/backlog.md`                 | Development backlog            |

---

## Optional Extensions

The project is designed with clear upgrade paths for production use:

| Extension                      | Current (MVP)                           | Upgrade path                                   |
| ------------------------------ | --------------------------------------- | ---------------------------------------------- |
| **Database**                   | JSON files in `data/imports/`           | SQLite via Drizzle ORM; then Postgres           |
| **Auth**                       | Anonymous use                           | Auth.js or Supabase (post-MVP)                  |
| **Map view**                   | Required in MVP (map-first UX)          | Marker clustering + advanced layers             |
| **Navigation UX**              | Required in MVP (nearest + route guide) | Turn-by-turn and accessibility-aware routing    |
| **Input validation**           | Inline checks in route handlers         | Zod schema validation                           |
| **Rate limiting**              | None                                    | Nitro rate-limit middleware                     |
| **Scheduled data import**      | Manual `npm run import:*`               | GitHub Actions scheduled workflow               |
| **Admin moderation**           | Stub admin pages                        | Full workflow with DB-backed status transitions |
| **i18n**                       | English only                            | `@nuxtjs/i18n` module                           |
| **Component library**          | Ad-hoc Tailwind classes                 | Design-token–based `ui/` component set          |
| **Pinia stores**               | Local component state                   | Shared Pinia stores for auth/preferences        |

See [`docs/backlog.md`](docs/backlog.md) for the full feature backlog and
[`docs/architecture.md`](docs/architecture.md) for architectural decision rationale.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Data Attribution

- Map data (c) [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) - ODbL
- Leipzig data: [Leipzig Open Data](https://opendata.leipzig.de) - CC BY 4.0
- Frankfurt data: [Frankfurt am Main Open Data](https://offenedaten.frankfurt.de) - dl-de/by-2-0
---

## Deployment Notes (GitHub Pages)

- This project is deployed as a static site on GitHub Pages via GitHub Actions.
- Deployment is handled by `.github/workflows/deploy.yml`.
- CI currently uses `npm install` in the deploy workflow to avoid lockfile strictness failures during Pages builds.
- GitHub Pages does not run a live Nuxt server, so API routes must be prerendered during `npm run generate`.
- Required behavior for releases:
  - No `/api/toilets` or `/api/toilets/:id` 404 on production Pages.
  - No fallback to Nuxt default placeholder view.
  - Imported city data must be present before static generation.
  - `data/imports/*.json` snapshots are committed so Pages deploys always ship non-empty toilet data.

## MVP UX Requirement

- MVP must include a proper map-first toilet discovery experience and basic navigation support.
- List view is a secondary fallback, not the primary/final MVP experience.
- Mobile UX is priority one: filters can be shown/hidden to keep map view near fullscreen.
- Mobile/desktop filters disable options with no matching data in the current dataset context.
- Empty states distinguish between `no imported data` and `no results for current filters`.
- Canonical app links use `/toilets/` to avoid extra redirect hops on Pages.

## Next Steps (Highest User Value)

1. Add a "trust layer" per toilet:
   - data freshness label
   - recent confirmation count
   - source confidence score
2. Add deduplication across OSM + city imports:
   - merge overlapping records into one canonical toilet entry
   - prevent duplicate markers and confusing reviews
3. Add a post-deploy smoke test:
   - verify `/toilets/` loads
   - verify `/api/toilets/index` is non-empty
   - fail deployment automatically if data is broken
4. Improve nearest-toilet speed and reliability:
   - lightweight marker clustering for dense zones
   - precomputed nearest subsets for mobile performance
5. Add basic reliability protections:
   - POST endpoint rate limiting
   - abuse throttling for reports/reviews

