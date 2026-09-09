# Delta for unified-tracking-api

**Change**: measurement-input-redesign
**Date**: 2026-09-08

---

## MODIFIED Requirements

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
