# Deploy Report - 2026-04-09

## Gate Results

- `npm test` -> PASS (41/41)
- `npm run build` -> PASS
- `npm run smoke:deploy` -> PASS
  - `Smoke check passed: 345 toilets available in static API payload.`
  - `Provenance snapshot: OpenStreetMap: 324 | Leipzig Open Data: 21`

## Scope Verification (Code-Level)

- Abuse protection utility is present and wired into POST endpoints.
- Provenance display/linking is present in list cards and detail views.
- Source filtering (`any`, `osm`, `city_open_data`, `other`) is present.
- Onboarding and feedback link are present.
- Navbar uses base backgrounds (no primary/accent nav backgrounds).
- Footer now uses base surface colors with AA-safe text/link contrast.

## Remaining Before Production Click

- Perform visual manual QA on desktop and mobile.
- Confirm production env vars and thresholds in hosting.
- Confirm observability/alerts are enabled.
- Deploy with rollback artifact/version ready.
- Tag release after merge (recommended tag format: `v0.1.0-demo-hardening`).
