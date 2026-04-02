# Sandra Loo 🚻

**Civic Toilet Finder + Awareness Game** — Nuxt 4 PWA for Germany (MVP)

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
│  │  ├─ toilet/
│  │  └─ ui/
│  ├─ composables/
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ admin/
│  │  ├─ game/
│  │  └─ toilets/
│  └─ stores/
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
│  └─ imports/             # Imported JSON data (gitignored)
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

## License

MIT — see [LICENSE](LICENSE)

---

## Data Attribution

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) – ODbL
- Leipzig data: [Leipzig Open Data](https://opendata.leipzig.de) – CC BY 4.0
- Frankfurt data: [Frankfurt am Main Open Data](https://offenedaten.frankfurt.de) – dl-de/by-2-0