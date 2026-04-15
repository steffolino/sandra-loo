# Sandra Loo

**Civic Toilet Finder + Awareness Game** - Nuxt 4 PWA for Germany (MVP)

> This project was primarily built using AI coding agents. Human review and civic-data quality principles are applied throughout.

## What is Sandra Loo?

Sandra Loo is a mobile-first Progressive Web App with two connected modules:

1. Civic utility: find, review, and report on public toilets in German cities
2. Awareness game: a stylized survival game built around bladder pressure, toilet choice, and humor rooted in real urban friction

### MVP cities

- Leipzig
- Frankfurt am Main

## Data policy

This project handles real-world civic data. No fake toilet data is generated.

- All toilet locations come from verifiable sources such as OpenStreetMap and city open-data portals
- Data is imported through scripts in `scripts/import/`, not hardcoded by hand
- Records include source metadata and timestamps
- If no data is imported, the app shows empty states rather than fake content

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Nuxt 4, Vue 3, TypeScript, Tailwind CSS |
| Mapping | OpenStreetMap + Leaflet |
| Backend | Nuxt server routes (Nitro) |
| Storage | JSON files for MVP |
| PWA | `@vite-pwa/nuxt` |
| State | Local/composable state, with Pinia available for future expansion |

## Getting started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

### Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Import real data

```bash
npm run import:osm
npm run import:leipzig
npm run import:frankfurt
```

See `docs/import-strategy.md` for details.

### Build for production

```bash
npm run build
npm run preview
```

### Run tests

```bash
npm test
```

## Current game MVP

The awareness game is currently a 3D, step-based run rather than a free-roam world.

- Each step offers three toilet choices: public toilet, cafe, and park
- Taking a step increases bladder pressure first
- The chosen toilet then changes bladder, igitt, and score
- Every 10 steps the player reaches a milestone shop and picks one bonus reward
- A full run currently lasts 20 steps
- The game HUD now lives directly inside the 3D scene, including bladder, igitt, step, pressure, and score

## Project structure

```text
/
|-- app/
|   |-- assets/css/
|   |-- components/
|   |   |-- game/
|   |   `-- toilet/
|   |-- composables/
|   |-- layouts/
|   `-- pages/
|       |-- admin/
|       |-- game/
|       `-- toilets/
|-- server/
|   |-- api/
|   `-- utils/
|-- shared/
|   `-- types/
|-- scripts/
|   `-- import/
|-- data/
|   `-- imports/
|-- docs/
|-- public/
`-- tests/
```

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/toilets` | List and filter toilets |
| GET | `/api/toilets/:id` | Toilet detail |
| POST | `/api/reviews` | Submit a review |
| POST | `/api/reports` | Submit a report |
| POST | `/api/confirmations` | Submit a confirmation |
| GET | `/api/leaderboard/daily` | Daily leaderboard |
| GET | `/api/leaderboard/all-time` | All-time leaderboard |
| POST | `/api/leaderboard/submit` | Submit a game score |
| GET | `/api/game/config` | Current game configuration |

## Documentation

| File | Description |
| --- | --- |
| `docs/product-mvp.md` | Product scope and principles |
| `docs/architecture.md` | Current system architecture |
| `docs/game-design.md` | Current game loop and mechanics |
| `docs/data-model.md` | Shared data model reference |
| `docs/api.md` | API reference |
| `docs/import-strategy.md` | Data import instructions |
| `docs/backlog.md` | Feature backlog |
| `CONTRIBUTING.md` | How to contribute (locales, cities, PR workflow) |
| `docs/DEPLOY_CHECKLIST.md` | Deployment checklist |
| `docs/DEPLOY_REPORT_2026-04-09.md` | Latest deployment gate report |
| `docs/RELEASE_NOTES_2026-04-09.md` | Latest release notes |

## Upgrade paths

The MVP intentionally keeps storage simple.

- Current storage is JSON-based for toilet data and MVP game configuration/state assumptions
- Persistent community submissions and leaderboard storage are still a post-MVP storage task
- The intended next storage upgrade is SQLite, followed by Postgres if the product grows

## Deployment notes

- The app can be built as a Node-hosted Nuxt app or prerendered for static hosting
- GitHub Pages requires prerendered payloads for the routes it serves
- Imported city data should be committed for reliable static deploys

## License

MIT - see `LICENSE`

## Data attribution

- OpenStreetMap contributors - ODbL
- Leipzig Open Data - CC BY 4.0
- Frankfurt am Main Open Data - dl-de/by-2-0
