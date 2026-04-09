# Deploy Checklist

Last updated: 2026-04-09

## 1) Release Scope Freeze

- [ ] No new feature commits after freeze starts.
- [ ] Scope is limited to:
  - Demo hardening (POST rate limiting, honeypot/cooldown checks)
  - Deploy smoke check
  - Homepage onboarding copy + feedback link
  - Data provenance visibility + source links/filter
  - Theme/nav/footer accessibility updates
- [ ] Confirm anonymous usage remains enabled.
- [ ] Confirm no social auth added.

## 2) CI/Pre-Deploy Gates

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run smoke:deploy` passes.
- [ ] Smoke output includes provenance distribution and no missing source metadata.

## 3) Manual QA (Desktop + Mobile)

- [ ] Homepage onboarding copy is visible and clear.
- [ ] Feedback link opens the issue/suggestion destination.
- [ ] Navbar uses base color backgrounds only (no primary/accent background fills).
- [ ] Footer contrast visually reads clearly (AA minimum) and links are legible.
- [ ] Toilet list and detail pages show source provenance labels/links.
- [ ] Source filter works (`any`, `osm`, `city_open_data`, `other`).
- [ ] Review/report/confirmation/leaderboard submissions still work for real users.
- [ ] Honeypot/cooldown protections block abuse while allowing normal usage.

## 4) Hosting/Runtime Config

- [ ] Production environment variables are set correctly.
- [ ] Rate-limit/cooldown thresholds match intended production values.
- [ ] Logging is enabled for 4xx/5xx API responses.
- [ ] Monitoring/alerts are configured for error spikes and latency regressions.

## 5) Deployment and Rollback

- [ ] Keep previous production artifact/version available for rollback.
- [ ] Deploy current release.
- [ ] Watch first 30-60 minutes:
  - [ ] API error rate
  - [ ] Submission success rate
  - [ ] Response latency
  - [ ] Smoke endpoint/data sanity
- [ ] If health degrades, rollback immediately and annotate incident notes.

## 6) Post-Deploy

- [ ] Add deployed commit SHA and timestamp to release notes.
- [ ] Announce deployment status to stakeholders.
- [ ] Capture follow-up tasks in backlog.
