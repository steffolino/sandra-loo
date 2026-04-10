# Product MVP - Sandra Loo

## Vision

Sandra Loo is a mobile-first PWA for Germany that combines:

- a practical civic toilet finder
- a stylized awareness game about toilet access, urgency, and public-space friction

## Product principles

1. Real data only for the civic utility
2. Empty-state-first UX rather than fake content
3. Mobile-first interaction and navigation
4. Transparent source metadata
5. Light humor with a grounded perspective
6. Separate utility and game modules, with room to evolve both

## MVP scope

### Geography

- Germany only
- MVP cities: Leipzig and Frankfurt am Main

### Module 1: Civic utility

| Feature | MVP | Future |
| --- | --- | --- |
| Map view | Yes | Yes |
| List view | Yes | Yes |
| City filter | Yes | Yes |
| Accessibility filter | Yes | Yes |
| Free-only filter | Yes | Yes |
| Toilet detail page | Yes | Yes |
| Source transparency | Yes | Yes |
| Community reviews | Yes | Yes |
| Issue reports | Yes | Yes |
| Confirmations | Yes | Yes |
| Basic navigation UX | Yes | Yes |
| Auth | No | Yes |

### Module 2: Awareness game

| Feature | MVP | Future |
| --- | --- | --- |
| Step-based run loop | Yes | Yes |
| 3D destination scene | Yes | Yes |
| Bladder meter | Yes | Yes |
| Igitt meter | Yes | Yes |
| Three toilet options per step | Yes | Yes |
| Milestone shops every 10 steps | Yes | Yes |
| Reward bonuses | Yes | Yes |
| Leaderboard | Yes | Yes |
| Free-roam exploration | No | Possible |
| Multiplayer | No | No |

## Current gameplay MVP definition

The current game MVP is defined as:

- 20-step runs
- three toilet choices per step
- bladder pressure applied before toilet relief
- milestone shop events every 10 steps
- reward bonuses that affect later steps
- a 3D scene with HUD-integrated meters and selection flow

## Non-goals for MVP

- Advanced AI features
- Real-time multiplayer
- Full moderation backoffice
- Automatic authority reporting
- Database-backed persistence for every submission on day one

## Delivery requirements

- Local development should run without manual repair steps
- The civic utility must work with imported real data only
- Static deployment must include required prerendered payloads
- The game should be playable end-to-end in its current step-based form
- The game HUD should keep the critical meters visible during play

## Storage stance for MVP

The MVP remains JSON-first.

- Toilet data is stored in JSON imports
- The project is intentionally avoiding SQL setup for the initial MVP
- SQLite remains the first upgrade path after MVP if persistence needs increase

## Highest-value next steps after this MVP slice

1. Add stronger milestone presentation so each 10-step checkpoint feels special
2. Improve game juice with better character animation and destination reveals
3. Persist submissions and leaderboard data in SQLite when MVP validation justifies it
4. Add integration and E2E coverage for critical civic and game flows
5. Automate data refresh and validation for imported city datasets
