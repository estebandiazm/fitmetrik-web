# Spec: unified-tracking-api

**Type**: NEW capability (full spec)
**Change**: daily-weight-tracking
**Date**: 2026-04-19

---

## Overview

A single HTTP endpoint accepts tracking data (steps, weight, or both) for a given date and client. External systems (wearables, automation tools) use this endpoint via an API key to submit readings without human interaction.

---

## Requirements

### REQ-UTA-01: Single Endpoint Contract

The system SHALL expose `POST /api/clients/[clientId]/tracking` that accepts a tracking payload for a specific date.

**Request shape**:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `date` | ISO 8601 date string (`YYYY-MM-DD`) | YES | Must not be a future date |
| `steps` | integer | NO (at least one of steps/weight required) | 0–100,000 |
| `weight` | number | NO (at least one of steps/weight required) | 0.1–500 |

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
    "weight": 80.0
  }
}
```

Fields `steps` and `weight` are omitted from the response if they were not included in the request.

#### Scenario: Valid request with both steps and weight
- **GIVEN** a valid API key and body `{ "date": "2026-04-19", "steps": 5000, "weight": 80 }`
- **WHEN** a POST is made to `/api/clients/[clientId]/tracking`
- **THEN** the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "steps": 5000, "weight": 80 } }`

#### Scenario: Valid request with steps only
- **GIVEN** a valid API key and body `{ "date": "2026-04-19", "steps": 8000 }`
- **WHEN** a POST is made to the endpoint
- **THEN** the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "steps": 8000 } }`

#### Scenario: Valid request with weight only
- **GIVEN** a valid API key and body `{ "date": "2026-04-19", "weight": 75.5 }`
- **WHEN** a POST is made to the endpoint
- **THEN** the system returns `200 OK` with `{ "success": true, "entry": { "date": "2026-04-19", "weight": 75.5 } }`

---

### REQ-UTA-02: Authentication

The system SHALL reject requests that do not carry a valid `x-api-key` header matching the target client.

| Condition | HTTP Status | Response body |
|-----------|-------------|---------------|
| Missing `x-api-key` header | `401 Unauthorized` | `{ "error": "Missing API key" }` |
| API key present but invalid or expired | `401 Unauthorized` | `{ "error": "Invalid API key" }` |
| API key belongs to a different client | `403 Forbidden` | `{ "error": "Forbidden" }` |

#### Scenario: Request with no API key
- **GIVEN** a POST with no `x-api-key` header
- **WHEN** the request reaches the endpoint
- **THEN** the system returns `401` with `{ "error": "Missing API key" }` and no data is written

#### Scenario: Request with an invalid API key
- **GIVEN** a POST with `x-api-key: bad-key-value`
- **WHEN** the request reaches the endpoint
- **THEN** the system returns `401` with `{ "error": "Invalid API key" }` and no data is written

#### Scenario: API key belongs to a different client
- **GIVEN** a valid API key for client B, but the URL references client A's ID
- **WHEN** the request reaches the endpoint
- **THEN** the system returns `403 Forbidden` and no data is written

---

### REQ-UTA-03: Input Validation

The system SHALL validate the request body and return structured errors for any violations.

| Violation | HTTP Status | Error message |
|-----------|-------------|---------------|
| Both `steps` and `weight` absent | `400 Bad Request` | `"At least one of 'steps' or 'weight' is required"` |
| `date` missing or invalid format | `400 Bad Request` | `"Invalid or missing date"` |
| `date` is a future date | `400 Bad Request` | `"Date cannot be in the future"` |
| `steps` out of range (< 0 or > 100,000) | `400 Bad Request` | `"Steps must be between 0 and 100000"` |
| `weight` out of range (< 0.1 or > 500) | `400 Bad Request` | `"Weight must be between 0.1 and 500"` |

Error response shape:
```json
{
  "success": false,
  "error": "<message from table above>"
}
```

#### Scenario: Body with neither steps nor weight
- **GIVEN** a valid API key and body `{ "date": "2026-04-19" }`
- **WHEN** a POST is made to the endpoint
- **THEN** the system returns `400` with `{ "success": false, "error": "At least one of 'steps' or 'weight' is required" }`

#### Scenario: Future date rejected
- **GIVEN** a valid API key and body `{ "date": "2099-01-01", "steps": 1000 }`
- **WHEN** a POST is made to the endpoint
- **THEN** the system returns `400` with `{ "success": false, "error": "Date cannot be in the future" }`

#### Scenario: Weight out of range
- **GIVEN** a valid API key and body `{ "date": "2026-04-19", "weight": 600 }`
- **WHEN** a POST is made to the endpoint
- **THEN** the system returns `400` with `{ "success": false, "error": "Weight must be between 0.1 and 500" }`

---

### REQ-UTA-04: Data Dispatch

The system SHALL persist tracking data by dispatching to the appropriate domain actions based on which fields are present in the request. When more than one data type is present in a single request, the dispatch MUST be atomic: if any dispatched persistence call fails — including validation of any item in `measurements[]` — then no data from that request is persisted (no steps, no weight, and no measurement entries).

(Previously: the atomic guarantee covered only the `steps` + `weight` combination; `measurements[]` was not part of the atomicity rule, so an invalid measurement could leave already-persisted step or weight data orphaned.)

| Fields present | Actions called |
|----------------|---------------|
| `steps` only | `addDailyStep(clientId, date, steps)` |
| `weight` only | `addDailyWeight(clientId, date, weight)` |
| `measurements` only | `addMeasurementEntries(clientId, date, measurements)` |
| Any combination of `steps`, `weight`, `measurements` | All corresponding actions — treated atomically (all succeed or nothing persists) |

Validation of the full payload — including every item in `measurements[]` — MUST complete before any persistence call runs.

#### Scenario: Both steps and weight dispatched atomically

- GIVEN a valid request body `{ "date": "2026-04-19", "steps": 5000, "weight": 80 }`
- WHEN the endpoint processes the request
- THEN both a step entry and a weight entry are recorded for the same date, and if either persistence call fails, neither is committed

#### Scenario: Steps-only dispatch

- GIVEN a valid request body `{ "date": "2026-04-19", "steps": 7500 }`
- WHEN the endpoint processes the request
- THEN only a step entry is recorded; no weight record is created or modified

#### Scenario: Weight-only dispatch

- GIVEN a valid request body `{ "date": "2026-04-19", "weight": 79.2 }`
- WHEN the endpoint processes the request
- THEN only a weight entry is recorded; no step record is created or modified

#### Scenario: Measurements-only dispatch

- GIVEN a valid request body `{ "date": "2026-05-10", "measurements": [{ "pointSlug": "cintura", "valueCm": 82 }] }`
- WHEN the endpoint processes the request
- THEN only the measurement entry is recorded; no step or weight record is created or modified

#### Scenario: Valid steps and an invalid measurement — nothing persists

- GIVEN a valid request body `{ "date": "2026-05-10", "steps": 6000, "measurements": [{ "pointSlug": "cintura", "valueCm": -4 }] }`
- WHEN the endpoint processes the request
- THEN the request is rejected with a validation error
- AND no step entry is recorded and no measurement entry is recorded for that date

---

## Out of Scope

- Batch submission of multiple dates in a single request (v1: one date per call)
- API key management UI (keys issued out-of-band in v1)
- Rate limiting (infrastructure concern, not specified here)
- DELETE or GET operations on tracked data via this endpoint
