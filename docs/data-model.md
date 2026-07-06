# Data Model - Sandra Loo

## Toilet

The central entity. All records must include `source`, `source_name`, and
`last_updated_at`.

The public UI is intentionally trait-first:

- place type
- free vs paid
- accessibility
- opening hours
- freshness and community confirmations as secondary signals

Source provenance stays in the model for maintenance and API consumers, but it
should not dominate the main browsing experience.

| Field             | Type    | Required | Description                           |
| ----------------- | ------- | -------- | ------------------------------------- |
| `id`              | string  | yes      | Unique ID, usually prefixed by source |
| `name`            | string? | no       | Display name, if available           |
| `type`            | enum    | yes      | `public`, `library`, `university`, `civic`, `culture`, `transit`, ...  |
| `address`         | string? | no       | Street address                       |
| `city`            | string  | yes      | City name                            |
| `lat`             | number  | yes      | Latitude (WGS 84)                    |
| `lng`             | number  | yes      | Longitude (WGS 84)                   |
| `source`          | string  | yes      | Source URL or identifier             |
| `source_name`     | string  | yes      | Human-readable source name           |
| `is_accessible`   | boolean | yes      | Wheelchair accessible                |
| `is_free`         | boolean | yes      | Free to use                          |
| `opening_hours`   | string? | no       | Opening hours, usually OSM format    |
| `notes`           | string? | no       | Additional notes                     |
| `created_at`      | ISO8601 | yes      | Record creation timestamp            |
| `last_updated_at` | ISO8601 | yes      | Last data update timestamp           |

## Review

User-submitted review of a toilet.

| Field           | Type    | Required | Description            |
| --------------- | ------- | -------- | ---------------------- |
| `id`            | string  | yes      | UUID                   |
| `toilet_id`     | string  | yes      | FK -> Toilet.id        |
| `user_id`       | string  | yes      | User ID or `anonymous` |
| `cleanliness`   | 1-5     | yes      | Cleanliness rating     |
| `lighting`      | 1-5     | yes      | Lighting rating        |
| `toilet_paper`  | boolean | yes      | Paper available        |
| `accessibility` | boolean | yes      | Accessible             |
| `comment`       | string? | no       | Free text comment      |
| `created_at`    | ISO8601 | yes      | Submission timestamp   |

## Report

User-submitted issue report.

| Field         | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `id`          | string  | yes      | UUID                              |
| `toilet_id`   | string  | yes      | FK -> Toilet.id                   |
| `user_id`     | string  | yes      | User ID or `anonymous`            |
| `type`        | enum    | yes      | `closed`, `dirty`, `broken`, ...  |
| `status`      | enum    | yes      | `open`, `acknowledged`, `resolved` |
| `description` | string? | no       | Optional details                  |
| `created_at`  | ISO8601 | yes      | Submission timestamp              |

## Confirmation

Community confirmation of toilet status.

| Field        | Type   | Required | Description                                |
| ------------ | ------ | -------- | ------------------------------------------ |
| `id`         | string | yes      | UUID                                       |
| `toilet_id`  | string | yes      | FK -> Toilet.id                            |
| `type`       | enum   | yes      | `open`, `clean`, `accessible`, `free`      |
| `created_at` | ISO8601| yes      | Timestamp                                  |

## GameScore

Leaderboard entry.

| Field               | Type              | Required | Description                |
| ------------------- | ----------------- | -------- | -------------------------- |
| `id`                | string            | yes      | UUID                       |
| `user_id`           | string            | yes      | User ID or `anonymous`     |
| `score`             | number            | yes      | Final score                |
| `steps_completed`   | number            | yes      | Steps completed in the run |
| `leaderboard_scope` | `daily`/`all-time` | yes      | Leaderboard category       |
| `city_scope`        | string?           | no       | Optional city filter       |
| `created_at`        | ISO8601           | yes      | Run end timestamp          |

## ID Conventions

| Source               | Prefix           | Example                   |
| -------------------- | ---------------- | ------------------------- |
| OpenStreetMap node   | `osm-node-`      | `osm-node-123456`         |
| OpenStreetMap way    | `osm-way-`       | `osm-way-789012`          |
| Institutional layer  | `institutional-`  | `institutional-way-42`    |
| Leipzig Open Data    | `leipzig-`       | `leipzig-42`              |
| Leipzig institutions | `leipzig-institutional-` | `leipzig-institutional-3` |
| Leipzig civic (experimental) | `leipzig-civic-` | `leipzig-civic-12`        |
| Frankfurt Open Data  | `frankfurt-`     | `frankfurt-7`             |

## UI Guidance

Use these signals for the map and filters:

- place-type icons for the marker itself
- `Free` / `Paid`
- `Accessible`
- `Hours shown`
- rating, freshness, and confirmations as supporting context

Treat source kind as backend metadata rather than a primary public filter. Experimental civic layers should stay outside the default merged toilet feed unless they have verified toilet access and opening hours.

Public-facing copy should be careful not to promise cleanliness, uptime, or free access. Public toilets can still be dirty, closed, or missing supplies, and future user reports/confirmations should be treated as the mechanism for tracking current state.

Institutional candidates are suggestions only. If they are shown publicly, we should avoid language that implies guaranteed toilet access or guaranteed free use. If you’re unsure, check with the people on site.
