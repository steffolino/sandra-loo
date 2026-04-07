# Backlog - Sandra Loo

## P0 Stability / Release Blockers

- [ ] Ensure local setup is reproducible on a clean machine (`npm ci`, imports, `npm run dev`, `npm run generate`).
- [ ] Eliminate GitHub Pages API 404s by prerendering all required read endpoints for static hosting.
- [ ] Add a deployment smoke check to verify toilet data loads on Pages after each release.
- [ ] Prevent fallback to Nuxt default placeholder view on production Pages deployment.
- [ ] Ship map-first toilet discovery in MVP (list-only is not acceptable as final MVP UX).
- [ ] Ship basic navigation support (nearest toilet and route guidance link-out/in-app path).

## Data

- [ ] Integrate OSM import into CI/CD pipeline (scheduled weekly)
- [ ] Define update frequency per data source
- [ ] Implement cross-source deduplication (same physical toilet in OSM + city data)
- [ ] Add data freshness indicator to toilet detail page
- [ ] Support additional cities (Berlin, Munich, Hamburg)
- [ ] Validate coordinates are within Germany bounding box

## Mapping

- [ ] Refine map UX (marker interaction, details-on-map, mobile ergonomics)
- [ ] Cluster markers for dense areas
- [ ] "Near me" proximity search using device geolocation
- [ ] Offline map tile caching (PWA)

## Game

- [ ] Balance toilet option probabilities based on playtesting
- [ ] Refine reward system (functional rewards, not just cosmetic)
- [ ] City-specific difficulty modes
- [ ] Event-based challenges
- [ ] Avatar visuals and cosmetic unlock system
- [ ] Sound effects and haptic feedback
- [ ] Achievement badges

## Auth

- [ ] Integrate real auth provider (e.g., Auth.js / Supabase)
- [ ] Named leaderboard entries require login
- [ ] Trust weighting for reviews by verified users
- [ ] Anti-abuse: rate limiting, report throttling

## Admin

- [ ] Full moderation workflow for reports
- [ ] Import run history and inspection UI
- [ ] Data quality dashboard
- [ ] Manual toilet record creation / edit

## UX / Design

- [ ] Design system (tokens, component library)
- [ ] Dark mode
- [ ] Animations and micro-interactions
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] i18n (German + English)

## API

- [ ] Replace in-memory store with SQLite (Drizzle ORM)
- [ ] Pagination for toilet list
- [ ] Rate limiting on POST endpoints
- [ ] OpenAPI / Swagger spec generation

## Testing

- [ ] API integration tests
- [ ] Game logic edge-case tests
- [ ] E2E tests (Playwright)
- [ ] Visual regression tests

## Infrastructure

- [ ] Docker / docker-compose setup
- [ ] GitHub Actions: test + build CI
- [ ] GitHub Actions: scheduled data import
- [ ] Deployment documentation
