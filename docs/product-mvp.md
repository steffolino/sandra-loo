# Product MVP - Sandra Loo

## Vision

Sandra Loo is a mobile-first PWA for Germany that solves a real civic problem
(finding accessible, clean public toilets) while raising awareness through a
stylized survival game from a female perspective.

---

## Product Principles

1. **Real data only** - no fabricated toilet locations, ever
2. **Empty-state-first UX** - designed states for no data, not errors
3. **Mobile-first** - optimized for one-handed use on small screens
4. **Transparent data sources** - every record shows its origin
5. **Light humor + subtle feminist perspective** - stylish, not cartoonish
6. **Extensible architecture** - utility and game are separate modules

---

## MVP Scope

### Geography
- Germany only
- MVP cities: **Leipzig**, **Frankfurt am Main**

### Module 1: Civic Utility

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
| Navigation UX (route + nearest WC guidance) | Yes | Yes |
| Auth (login) | No | Yes |

### Module 2: Awareness Game

| Feature | MVP | Future |
| --- | --- | --- |
| Run-based game | Yes | Yes |
| Bladder meter | Yes | Yes |
| Igitt meter | Yes | Yes |
| Toilet option choice | Yes | Yes |
| Step progression | Yes | Yes |
| Cosmetic rewards | Yes | Yes |
| Leaderboard | Yes | Yes |
| Avatar visuals | No | Yes |
| Multiplayer | No | No |

---

## Non-Goals (MVP)

- Advanced gamification or AI features
- Real-time multiplayer
- Full admin moderation workflow
- Automatic authority reporting
- Auth provider integration (anonymous use is default)

---

## Delivery Requirements (MVP)

- Local development must run end-to-end (`npm ci`, imports, `npm run dev`, `npm run generate`) without manual fixes.
- GitHub Pages deployment must not show Nuxt default placeholder or API 404 for toilet list/detail pages.
- Static deployment must pre-render required API JSON payloads used by the frontend.
- MVP civic utility must include a usable map-first experience and basic user navigation support, not list-only browsing.
- Filter UX must disable unavailable options and show an explicit "no filter matches" message when data exists but current filters return zero results.

---

## Next Steps With Highest Civic Value

1. Add toilet trust indicators (freshness + confirmations + source confidence) directly in list/map cards.
2. Merge duplicate toilets across OSM and city datasets before serving API payloads.
3. Add release smoke tests that fail CI when `/toilets/` renders but API data is empty.
4. Improve mobile map performance for dense city centers (clustering + faster nearest handling).
5. Add anti-abuse controls for reports/reviews to protect data quality.
