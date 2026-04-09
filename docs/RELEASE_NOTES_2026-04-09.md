# Release Notes - 2026-04-09

## Summary

This release hardens anonymous demo submissions, improves deployment safety checks, adds transparent data provenance, and updates onboarding/theming/accessibility polish.

## Included Changes

### Security and Abuse Protection

- Added shared POST abuse protection utility for:
  - Rate limiting
  - Honeypot detection
  - Cooldown/timing checks
- Applied protection to submission endpoints:
  - Reviews
  - Reports
  - Confirmations
  - Leaderboard submissions
- Kept anonymous usage model intact.
- No social authentication added.

### Deployment Safety

- Added deploy smoke script and CI integration.
- Smoke checks validate:
  - Static API payload presence
  - Provenance metadata presence
  - Provenance distribution snapshot output

### Provenance Transparency

- Added provenance helper + display in:
  - Toilet cards
  - Selected map/list panel
  - Toilet detail page
- Added source URLs to records/imports and backfill handling for existing snapshots.
- Added source filter options in API/UI:
  - `any`
  - `osm`
  - `city_open_data`
  - `other`

### UX and Content

- Added homepage onboarding copy.
- Added persistent feedback link to issue/suggestion flow.

### Theme and Accessibility

- Applied cube palette direction:
  - `#845ec2`
  - `#4e8397`
  - `#d5cabd` (used via lighter off-white shades for base surfaces)
- Updated navigation to avoid primary/accent backgrounds; uses base tones.
- Updated footer colors for better blending and contrast.
- Footer text/link contrast meets WCAG AA.

## Validation Performed

- `npm test` -> pass (41 tests)
- `npm run build` -> pass
- `npm run smoke:deploy` -> pass
  - Snapshot observed: `OpenStreetMap: 324 | Leipzig Open Data: 21`

## Deployment Notes

- Pre-existing Nuxt warning noise appears during build logs, but build exits successfully.
- Use `docs/DEPLOY_CHECKLIST.md` for final deploy/rollback flow.
