# Contributing to Sandra Loo

Thanks for contributing.

Sandra Loo is a civic data project. Contributions are welcome, but we keep a high bar for data quality, accessibility, and clear source attribution.

## Ground rules

- No fake toilet data. Ever.
- No hardcoded map records in app code.
- Import data through scripts in `scripts/import/`.
- Keep source metadata (`source_name`, `source_url`, timestamps) intact.
- Prefer small, focused pull requests.

## Development setup

1. Fork and clone the repository.
2. Install dependencies:
   - `npm install`
3. Copy env template:
   - `cp .env.example .env`
4. Start dev server:
   - `npm run dev`

## Before opening a PR

Run these checks locally:

- `npm run lint`
- `npm test`
- `npm run i18n:validate`
- `npm run generate`

If your change touches import pipelines, also run relevant import scripts and ensure `data/imports/*.json` is valid and non-empty where expected.

## Adding a new locale

1. Add a locale JSON file in `locales/` (for example `it.json`).
2. Register the locale in `nuxt.config.ts` under `i18n.locales`.
3. Translate all user-facing keys (do not leave English placeholders unless explicitly marked as temporary in PR notes).
4. Validate locale coverage:
   - `npm run i18n:validate`
5. Test language switching in UI:
   - top-level navigation
   - toilets list and detail pages
   - filters and status labels

## Adding a new city/data source

1. Create a dedicated importer in `scripts/import/` (follow existing patterns like `osm.ts`, `leipzig.ts`, `frankfurt.ts`).
2. Output normalized records to `data/imports/<city>.json`.
3. Keep IDs deterministic (`<source>-<stable-id>`).
4. Include and preserve source attribution fields.
5. Update merge/prerender behavior if new dataset should be part of deploy.
6. Document the source and procedure in `docs/import-strategy.md`.
7. Run:
   - `npm run generate`
   - deployment smoke checks if relevant (`npm run smoke:deploy`)

## Code style expectations

- TypeScript strictness should remain intact.
- Keep components readable and mobile-safe.
- Reuse existing utilities/types instead of duplicating logic.
- Avoid broad refactors in feature PRs unless explicitly scoped.

## Pull request checklist

- Clear title and summary of what changed and why.
- Linked issue/context when available.
- Screenshots for UI changes (desktop + mobile when relevant).
- Notes on data/source assumptions.
- Mention any follow-up tasks not included in the PR.

## What maintainers look for

- Behavioral correctness (not just passing build).
- No regression in i18n, filtering, routing, or static generation.
- Data provenance and civic-data integrity.
- Clear migration/rollback path for risky changes.

## Security and sensitive issues

Do not open public issues for sensitive vulnerabilities.

Contact maintainers privately and include:
- affected area
- reproduction steps
- potential impact
- suggested mitigation
