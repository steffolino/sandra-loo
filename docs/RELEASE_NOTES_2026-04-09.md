# Release Notes - 2026-04-09

## Addendum - 2026-04-15

### Localization and Routing Hardening

- Replaced remaining hardcoded UI copy in game/admin/home surfaces with i18n keys.
- Added missing translations across active locales (`de`, `pl`, `tr`, `en`, `ar`, `ru`) for:
  - Home feature card descriptions and onboarding note
  - Admin table labels and empty-state copy
  - Game HUD, milestone, step summary, and leaderboard labels
  - Shared accessibility labels (`common.language`, `common.select_language`)
- Updated locale-aware navigation:
  - Internal links now consistently resolve through locale path helpers.
  - Toilet card detail links preserve selected locale.
  - Header active-route matching now supports all 2-letter locale prefixes.
- Improved locale persistence behavior in language switcher:
  - Restore from localStorage
  - Keep i18n cookie in sync
  - Keep document text direction in sync (LTR/RTL)

### Static Deploy Robustness

- Added a static API payload fallback writer for CI/static output when `/api/toilets/index` is missing.
- Updated deploy smoke checks to be locale-agnostic (no brittle hardcoded English text assertion).

### Operational Notes

- If production still shows mixed-language content after deploy, force a fresh deploy artifact and clear CDN/browser cache.
- Build/generate logs may be long due to large localized route set; treat timeout as inconclusive unless error output is present.

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
