# Data Model – Sandra Loo

## Toilet

The central entity. All records must include `source`, `source_name`, and
`last_updated_at`.

| Field            | Type    | Required | Description                                 |
| ---------------- | ------- | -------- | ------------------------------------------- |
| `id`             | string  | ✓        | Unique ID (prefixed: `osm-node-123`)        |
| `name`           | string? | –        | Display name, if available                  |
| `type`           | enum    | ✓        | `public`, `cafe`, `restaurant`, ...         |
| `address`        | string? | –        | Street address                              |
| `city`           | string  | ✓        | City name                                   |
| `lat`            | number  | ✓        | Latitude (WGS 84)                           |
| `lng`            | number  | ✓        | Longitude (WGS 84)                          |
| `source`         | string  | ✓        | Source URL or identifier                    |
| `source_name`    | string  | ✓        | Human-readable source name                  |
| `is_accessible`  | boolean | ✓        | Wheelchair accessible                       |
| `is_free`        | boolean | ✓        | Free to use                                 |
| `opening_hours`  | string? | –        | OSM opening_hours format                    |
| `notes`          | string? | –        | Additional notes                            |
| `created_at`     | ISO8601 | ✓        | Record creation timestamp                   |
| `last_updated_at`| ISO8601 | ✓        | Last data update timestamp                  |

---

## Review

User-submitted review of a toilet.

| Field           | Type    | Required | Description              |
| --------------- | ------- | -------- | ------------------------ |
| `id`            | string  | ✓        | UUID                     |
| `toilet_id`     | string  | ✓        | FK → Toilet.id           |
| `user_id`       | string  | ✓        | User ID or `anonymous`   |
| `cleanliness`   | 1–5     | ✓        | Cleanliness rating       |
| `lighting`      | 1–5     | ✓        | Lighting rating          |
| `toilet_paper`  | boolean | ✓        | Paper available          |
| `accessibility` | boolean | ✓        | Accessible               |
| `comment`       | string? | –        | Free text comment        |
| `created_at`    | ISO8601 | ✓        | Submission timestamp     |

---

## Report

User-submitted issue report.

| Field         | Type   | Required | Description                        |
| ------------- | ------ | -------- | ---------------------------------- |
| `id`          | string | ✓        | UUID                               |
| `toilet_id`   | string | ✓        | FK → Toilet.id                     |
| `user_id`     | string | ✓        | User ID or `anonymous`             |
| `type`        | enum   | ✓        | `closed`, `dirty`, `broken`, ...   |
| `status`      | enum   | ✓        | `open`, `acknowledged`, `resolved` |
| `description` | string?| –        | Optional details                   |
| `created_at`  | ISO8601| ✓        | Submission timestamp               |

---

## Confirmation

Community confirmation of toilet status.

| Field       | Type   | Required | Description                     |
| ----------- | ------ | -------- | ------------------------------- |
| `id`        | string | ✓        | UUID                            |
| `toilet_id` | string | ✓        | FK → Toilet.id                  |
| `type`      | enum   | ✓        | `open`, `clean`, `accessible`, `free` |
| `created_at`| ISO8601| ✓        | Timestamp                       |

---

## GameScore

Leaderboard entry.

| Field               | Type            | Required | Description                |
| ------------------- | --------------- | -------- | -------------------------- |
| `id`                | string          | ✓        | UUID                       |
| `user_id`           | string          | ✓        | User ID or `anonymous`     |
| `score`             | number          | ✓        | Final score                |
| `steps_completed`   | number          | ✓        | Steps completed in the run |
| `leaderboard_scope` | `daily`/`all-time` | ✓    | Leaderboard category       |
| `city_scope`        | string?         | –        | Optional city filter       |
| `created_at`        | ISO8601         | ✓        | Run end timestamp          |

---

## ID Conventions

| Source              | Prefix            | Example                    |
| ------------------- | ----------------- | -------------------------- |
| OpenStreetMap node  | `osm-node-`       | `osm-node-123456`          |
| OpenStreetMap way   | `osm-way-`        | `osm-way-789012`           |
| Leipzig Open Data   | `leipzig-`        | `leipzig-42`               |
| Frankfurt Open Data | `frankfurt-`      | `frankfurt-7`              |
