# Delta for unified-tracking-api

**Change**: body-measurements-tracking
**Date**: 2026-05-10

---

## MODIFIED Requirements

### Requirement: Single Endpoint Contract

The system SHALL expose `POST /api/clients/[clientId]/tracking` that accepts a tracking payload for a specific date. At least one of `steps`, `weight`, or `measurements` MUST be present.

(Previously: required at least one of `steps` or `weight`; `measurements` did not exist.)

**Request shape**:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `date` | ISO 8601 date string (`YYYY-MM-DD`) | YES | Must not be a future date |
| `steps` | integer | NO | 0–100,000 |
| `weight` | number | NO | 0.1–500 |
| `measurements` | `Array<{ pointSlug: string; valueCm: number; notes?: string }>` | NO | At least one of steps/weight/measurements required; each item validated per BMT catalog ranges |

**Request headers**:

| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | YES | Client-scoped API key |

**Success response** (`200 OK`):

```json
{
  "success": true,
  "entry": {
    "date": "2026-04-19",
    "steps": 5000,
    "weight": 80.0,
    "measurements": [
      { "pointSlug": "cintura", "valueCm": 82 }
    ]
  }
}
```

Fields `steps`, `weight`, and `measurements` are omitted from the response if they were not included in the request.

#### Scenario: Valid request with both steps and weight

- GIVEN a valid API key and body `{ "date": "2026-04-19", "steps": 5000, "weight": 80 }`
- WHEN a POST is made to `/api/clients/[clientId]/tracking`
- THEN the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "steps": 5000, "weight": 80 } }`

#### Scenario: Valid request with steps only

- GIVEN a valid API key and body `{ "date": "2026-04-19", "steps": 8000 }`
- WHEN a POST is made to the endpoint
- THEN the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "steps": 8000 } }`

#### Scenario: Valid request with weight only

- GIVEN a valid API key and body `{ "date": "2026-04-19", "weight": 75.5 }`
- WHEN a POST is made to the endpoint
- THEN the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "weight": 75.5 } }`

#### Scenario: Valid request with measurements only

- GIVEN a valid API key and body `{ "date": "2026-05-10", "measurements": [{ "pointSlug": "cintura", "valueCm": 82 }, { "pointSlug": "pecho", "valueCm": 97 }] }`
- WHEN a POST is made to the endpoint
- THEN the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-05-10", "measurements": [...] } }`

#### Scenario: Valid request with steps, weight, and measurements combined

- GIVEN a valid API key and body with all three fields populated
- WHEN a POST is made to the endpoint
- THEN all three data types are persisted and all three appear in the `entry` response object

---

## ADDED Requirements

### Requirement: Measurement Dispatch and Validation

The system SHALL validate each item in `measurements[]` against the per-point catalog ranges before persisting, and SHALL dispatch to `addMeasurementEntries(clientId, date, measurements)` when `measurements[]` is present in the request.

| Condition | HTTP Status | Response |
|-----------|-------------|----------|
| `measurements[]` present and valid | `200 OK` | entries persisted |
| `measurements[]` contains an out-of-range `valueCm` | `400 Bad Request` | `{ "success": false, "error": "<slug>: valor fuera del rango (<min>–<max> cm)" }` |
| `measurements[]` contains an unknown `pointSlug` | `400 Bad Request` | `{ "success": false, "error": "Unknown measurement point: <slug>" }` |
| All three of `steps`, `weight`, `measurements` absent | `400 Bad Request` | `{ "success": false, "error": "At least one of 'steps', 'weight', or 'measurements' is required" }` |

#### Scenario: Measurements dispatched alongside steps

- GIVEN a valid request with `steps: 6000` and `measurements: [{ pointSlug: "cintura", valueCm: 80 }]`
- WHEN the endpoint processes the request
- THEN both the step entry and the measurement entry are recorded; if either fails, neither is committed

#### Scenario: Unknown pointSlug rejected

- GIVEN `measurements: [{ "pointSlug": "espalda-baja", "valueCm": 90 }]`
- WHEN a POST is made to the endpoint
- THEN the system returns `400` with `{ "success": false, "error": "Unknown measurement point: espalda-baja" }` and nothing is persisted

#### Scenario: Out-of-range measurement value rejected via API

- GIVEN `measurements: [{ "pointSlug": "pantorrilla", "valueCm": 120 }]` (limb max: 100 cm)
- WHEN a POST is made to the endpoint
- THEN the system returns `400` with `{ "success": false, "error": "pantorrilla: valor fuera del rango (10–100 cm)" }` and nothing is persisted
