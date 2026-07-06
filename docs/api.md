# API Reference – Sandra Loo

All endpoints return JSON. On error, the response body is:

```json
{
  "statusCode": 404,
  "message": "Toilet not found"
}
```

---

## Toilets

### `GET /api/toilets`

List and filter toilets.

**Query parameters**

| Parameter       | Type    | Description                                |
| --------------- | ------- | ------------------------------------------ |
| `city`          | string  | Filter by city (e.g. `Leipzig`)            |
| `is_free`       | boolean | `true` to show only free toilets           |
| `is_accessible` | boolean | `true` to show only accessible toilets     |
| `has_opening_hours` | boolean | `true` to show only records with opening hours |
| `type`          | string  | Place type (e.g. `public`, `library`, `cafe`) |
| `reported`      | boolean | `true` only with reports, `false` without  |
| `min_rating`    | number  | Minimum average rating (1-5)               |
| `sort`          | string  | `nearest`, `rating`, or `updated`          |
| `lat`           | number  | Latitude for proximity search              |
| `lng`           | number  | Longitude for proximity search             |
| `radius`        | number  | Radius in km for proximity search          |

Note: `source_kind` remains available in the backend for maintenance and API
consumers, but it is not a primary public filter in the UI.

**Response**

```json
{
  "data": [
    {
      "id": "osm-node-123",
      "avg_rating": 4.2,
      "review_count": 8,
      "report_count": 1,
      "has_reports": true,
      "freshness_days": 12,
      "freshness_label": "fresh",
      "recent_confirmation_count": 3,
      "source_confidence_score": 90,
      "source_confidence_level": "high",
      "distance_km": 0.6
    }
  ],
  "meta": { "total": 42, "hasData": true }
}
```

---

### `GET /api/toilets/:id`

Get a single toilet with reviews, reports, and confirmations.

**Response**

```json
{
  "data": {
    "id": "osm-node-123",
    "name": "Marktplatz",
    "reviews": [],
    "reports": [],
    "confirmations": []
  }
}
```

**Errors**

- `404` – toilet not found

---

## Reviews

### `POST /api/reviews`

Submit a review.

**Body**

```json
{
  "toilet_id": "osm-node-123",
  "cleanliness": 4,
  "lighting": 3,
  "toilet_paper": true,
  "accessibility": false,
  "comment": "Pretty clean for a public toilet!"
}
```

**Validation**

- `toilet_id`: required string
- `cleanliness`, `lighting`: required integer 1–5

**Response** `201 Created`

```json
{ "data": { /* Review */ } }
```

---

## Reports

### `POST /api/reports`

Submit an issue report.

**Body**

```json
{
  "toilet_id": "osm-node-123",
  "type": "dirty",
  "description": "No paper, very dirty."
}
```

**Valid types**: `closed`, `dirty`, `broken`, `unsafe`, `missing`, `other`

**Response** `201 Created`

```json
{ "data": { /* Report */ } }
```

---

## Confirmations

### `POST /api/confirmations`

Confirm current status.

**Body**

```json
{
  "toilet_id": "osm-node-123",
  "type": "clean"
}
```

**Valid types**: `open`, `clean`, `accessible`, `free`

**Response** `201 Created`

```json
{ "data": { /* Confirmation */ } }
```

---

## Leaderboard

### `GET /api/leaderboard/daily`

Top 100 scores for today.

**Response**

```json
{
  "data": [ /* GameScore[] */ ],
  "meta": { "scope": "daily", "total": 5, "hasData": true }
}
```

---

### `GET /api/leaderboard/all-time`

Top 100 scores of all time.

---

### `POST /api/leaderboard/submit`

Submit a game score.

**Body**

```json
{
  "score": 850,
  "steps_completed": 8,
  "city_scope": "Leipzig"
}
```

**Response** `201 Created`

---

## Game

### `GET /api/game/config`

Returns the current game configuration.

**Response**

```json
{
  "data": {
    "maxSteps": 10,
    "pointsPerStep": 100,
    "meterMax": 100,
    "meterDangerThreshold": 75,
    "rewardsPerStep": 3,
    "toiletOptions": [ /* ToiletOption[] */ ]
  }
}
```
