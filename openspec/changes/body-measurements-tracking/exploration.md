## Exploration: Body Measurements Tracking

### Current State

The system already has a mature tracking pattern for two metrics — daily steps and daily weight. Both follow the same shape:

**Domain types** (`src/domain/types/`):
- `DailyStepSchema` / `DailyStep` — Zod-defined, fields: `date`, `steps`, `notes?`
- `DailyWeightSchema` / `DailyWeight` — Zod-defined, fields: `date`, `weight`, `notes?`

**Mongoose model** (`src/lib/models/Client.ts`):
- `ClientSchema` embeds both as arrays: `dailySteps[]` and `dailyWeights[]` inside the single `Client` document
- Coach-controlled config fields sit flat on the Client doc: `stepGoal` (number), `targetWeight` (number)
- No separate collection exists for tracking data — everything lives in the Client document

**Server Actions** (`src/app/actions/clientActions.ts`):
- `addDailyStep` / `addDailyWeight` — upsert by date (find by day, replace or push)
- `setStepGoal` / `setTargetWeight` — simple `findByIdAndUpdate` for coach-set config
- `getDailyStepsRange`, `getDailyWeights` — array filtering (JS-side, not Mongo aggregation)

**API route** (`src/app/api/clients/[clientId]/tracking/route.ts`):
- `POST /api/clients/[clientId]/tracking` — unified endpoint, accepts `steps` and/or `weight` in the same request body, dispatches to Server Actions, secured by per-client API key

**Coach configuration UX** (`src/components/coach/StepGoalEditor.tsx`, `WeightGoalEditor.tsx`):
- Simple input + Save button components that call `setStepGoal` / `setTargetWeight`
- Rendered inside `src/app/(dashboard)/clients/[clientId]/page.tsx` under dedicated sections ("Step Goal", "Target Weight")

**Client-side entry UX** (`src/components/client/DailyStepsModal.tsx`, `DailyWeightModal.tsx`):
- Modal dialogs with date + value + optional notes
- Opened from `ActivityPageClient` via "+ Add Record" button
- Uses Server Action directly from modal (no API route)

**Activity page layout** (`src/app/(client-portal)/activity/page.tsx` + `ActivityPageClient.tsx`):
- Tab switcher: "Steps" | "Weight"
- Each tab: SummaryCard or chart → TrendsChart or WeightTrendsChart (Recharts 3.8) → history table
- Chart components use `GlassCard` wrapper, Recharts `BarChart` (steps) and `AreaChart` (weight) with `ReferenceLine` for goals

**Dashboard** (`src/app/(client-portal)/dashboard/page.tsx`):
- Summary widget row with `StepsCounter` and `WeightCounter` cards — compact "last value + progress bar" cards that link to `/activity`

**Bottom nav**: Dashboard | Activity | Profile (Profile is a placeholder `#` link)

**No body measurement code exists yet** — zero references to `measurement`, `medida`, or body diagram SVGs in the codebase.

---

### Affected Areas

- `src/domain/types/Client.ts` — extend `Client` interface with `measurementPoints` and `measurements` fields
- `src/domain/types/` — new file `BodyMeasurement.ts` (Zod schema for a log entry) and `MeasurementPoint.ts` (catalog entry)
- `src/lib/models/Client.ts` — add two sub-schemas: `MeasurementPointSchema` (config) and `MeasurementEntrySchema` (log)
- `src/app/actions/clientActions.ts` — new functions: `setMeasurementPoints`, `addMeasurementEntry`, `getMeasurementEntries`
- `src/app/api/clients/[clientId]/tracking/route.ts` — optionally extend to accept `measurements[]` field for API-key clients
- `src/app/(client-portal)/activity/page.tsx` — add a third tab "Measurements" (or a new sibling route)
- `src/components/activity/ActivityPageClient.tsx` — add `measurements` tab + wiring
- New components in `src/components/activity/`:
  - `BodyDiagram.tsx` — SVG silhouette with interactive hotspots
  - `MeasurementTrendsChart.tsx` — AreaChart for selected point (like WeightTrendsChart)
  - `MeasurementHistory.tsx` — history table matching the design (Fecha · Medida cm · Cambio Δ)
  - `AddMeasurementModal.tsx` — batch-capable add modal
- New component in `src/components/coach/`:
  - `MeasurementPointsEditor.tsx` — checklist/toggle UI for coach to activate/deactivate points per client
- `src/app/(dashboard)/clients/[clientId]/page.tsx` — add "Measurement Points" section using `MeasurementPointsEditor`
- `src/components/dashboard/` — possibly a `MeasurementsCounter` widget (low priority, can be deferred)
- `src/components/layout/BottomNavBar.tsx` — no change needed; measurements live under the existing "Activity" tab

---

### Approaches

#### Approach M1 — Fully Embedded (follow existing pattern exactly)

Both configured points AND log entries live as embedded arrays on the `Client` document:
- `Client.measurementPoints[]` → `{ id, label, slug, bodyCoords: {x, y}, active }` (coach-set, slow-changing)
- `Client.measurements[]` → `{ date, pointSlug, valueCm, notes? }` (client-logged, grows over time)

- **Pros**:
  - Perfectly mirrors `dailySteps[]` / `dailyWeights[]` — zero new patterns, zero new collections
  - Single document read gives everything; no joins
  - Server Actions stay exactly the same shape (`findById` → mutate → `save`)
  - Trivially consistent — no cross-collection integrity issues
- **Cons**:
  - MongoDB 16 MB document limit becomes real. A client measuring 8 points daily for 3 years = ~8,760 entries. Each entry is ~80 bytes (BSON) → ~700 KB just for measurements. Combined with diet plans, steps, weights, a heavy client hits 2–4 MB. Still within the 16 MB cap but uncomfortably large for a single document.
  - Querying "history for one point" requires fetching the full Client doc and filtering in JS — same pattern as today's `getDailyStepsRange`, which already does this
  - `$push` with large arrays means Mongo rewrites the entire document on disk when it grows beyond the allocated space (document padding), causing write amplification
- **Effort**: Low — follows existing code exactly

#### Approach M2 — Separate Collection for Log Entries (hybrid config+log split)

`measurementPoints[]` stays embedded on Client (small, coach-configured, infrequently changed). Log entries go into a separate `BodyMeasurement` collection:

```
BodyMeasurement { clientId, pointSlug, date, valueCm, notes? }
index: { clientId: 1, pointSlug: 1, date: -1 }
index: { clientId: 1, date: -1 }
```

- **Pros**:
  - Document size stays bounded regardless of how long the client tracks
  - Native Mongo queries for history per point, last value per point (aggregation pipeline)
  - Scales to multi-year tracking without Client document bloat
  - Index on `clientId + pointSlug + date` supports the "one point trend" query pattern directly
- **Cons**:
  - New collection = new Mongoose model, new file in `src/lib/models/`
  - Server Actions need to query two things: Client (for configured points) + BodyMeasurement (for log data)
  - Slightly more complex than today's pattern — introduces a join at the application layer
  - `toClient()` helper in `clientActions.ts` doesn't automatically include measurements; needs a separate fetch
- **Effort**: Medium — new model + adapted actions, but conceptually clean

#### Approach M3 — Fully Separate Collection (catalog + log both external)

Both measurement point catalog and log entries live in separate collections. The catalog is global (all clients share the same 8 points), and per-client active points are just a list of slugs on the Client doc.

- **Pros**:
  - Clean separation; catalog changes don't require Client document migration
  - Could support a global "catalog management" UI for coaches in the future
- **Cons**:
  - Over-engineered for current scale (8 fixed points, per-client toggle is trivial to embed)
  - Three-way join (Client + catalog + log) for a single page load
  - Catalog is effectively static — putting it in Mongo adds infra overhead with no benefit
  - Conflicts with the explicit decision that "coach configures per-client" — a global catalog doesn't map naturally to that ownership model
- **Effort**: High — with low benefit at current scale

---

### Recommendation

**Use M2 (Hybrid: config embedded, log entries in separate collection).**

Rationale:

1. **Document growth is the decisive factor.** The existing `dailySteps` / `dailyWeights` arrays have stayed manageable because weight is logged once per day and steps once per day. Measurements could be 8 entries per session, possibly multiple sessions. Over 2 years that's 5,000–10,000 entries — an order of magnitude more than steps/weights. M1 would eventually hit uncomfortable document sizes. M2 eliminates this risk with a straightforward Mongoose model.

2. **`measurementPoints` config stays embedded** — it's a small list (≤20 items), changes infrequently (coach configures once), and is always needed alongside the Client. This mirrors `stepGoal` and `targetWeight`.

3. **The activity page's query pattern** (history for one point over 30 days) maps cleanly to a Mongo index on `{ clientId, pointSlug, date }`. With M1 you'd fetch the full Client doc and filter in JS, which is fine today but degrades as the array grows.

4. **Implementation effort is Medium, not High.** The new `BodyMeasurementModel` mirrors `DailyStepsSchema` structurally. Server Actions gain two new functions (`addMeasurementEntry`, `getMeasurementsByPoint`). The rest of the UI layer follows exactly the same patterns already proven with weight tracking.

**Body diagram UI:** Use an inline SVG silhouette with `<circle>` hotspots positioned by absolute coordinates (cx/cy as percentages of viewBox). Each hotspot is a `<button>` for accessibility. This matches the mock's glowing-dot aesthetic, is themable with CSS variables/Tailwind, and requires zero new dependencies. Store `bodyCoords: { x: number; y: number }` (0–100 percentage-based) on each `MeasurementPoint` so coordinates are data-driven, not hardcoded in JSX.

**Add-record modal:** Support batch entry (multiple points in one submission) since the design's "+ Agregar Registro" button implies a single modal for one session's measurements. A "select multiple body zones + enter values" UX is natural here. Each submitted point produces one `BodyMeasurement` document.

**Trends chart:** One point at a time (matching the design — dropdown to switch between active points). Cross-point overlay is a future enhancement; don't design it now.

**API route extension:** Add `measurements[]` field to `TrackingEntrySchema` in the existing route to allow wearable/external integrations. Each item: `{ pointSlug, valueCm, notes? }`. Keep it optional so existing API consumers are unaffected.

**Validation bounds:** Global defaults by zone type (not coach-configurable in v1): trunk/core 30–200 cm, limbs 10–100 cm. Store bounds on the `MeasurementPoint` definition in code (a static lookup map in `domain/services/`), not in the DB.

---

### Risks

- **Document size (if M1 is chosen despite recommendation):** With high-frequency tracking, the Client document could grow to several MB. MongoDB's 16 MB limit is not immediately hit, but query performance degrades as array size grows due to full-document reads.
- **Data migration for existing clients:** When the `measurementPoints` field is added to ClientSchema, existing clients have `undefined`/empty arrays — handled gracefully by optional fields in Mongoose. No migration script needed for the config array. The `BodyMeasurement` collection starts empty for all clients naturally.
- **Unified tracking API (`/tracking` route):** Adding `measurements[]` to the schema is backward-compatible (optional field). Existing calls with only `steps`/`weight` continue to work unchanged.
- **Body diagram coordinates:** The 8 seed measurement points need (x, y) coordinates mapped to the SVG viewBox. These must be determined once against the actual SVG silhouette asset during implementation. If the silhouette design changes, coordinates need updating. Mitigate by making coords data-driven (stored on the point, not hardcoded in JSX).
- **Recharts for measurements chart:** Recharts 3.8 is already installed and used for `WeightTrendsChart` (AreaChart). The measurements trend chart reuses the same pattern — no additional dependencies.
- **Dashboard widget:** The existing dashboard already has 4 widgets in a grid row. Adding a 5th "last measurements" widget would break the layout. Recommend either deferring a dashboard widget entirely for v1, or replacing the placeholder "Profile" nav with a "Measurements" shortcut rather than polluting the dashboard grid.
- **Tab navigation:** Adding a third tab to `ActivityPageClient` ("Measurements") is straightforward but shifts the UX slightly. Alternative: give measurements its own route `/activity/measurements` to avoid overloading the activity page. The mock's design suggests measurements is a full-page experience (body diagram + chart + history), not a secondary tab — a dedicated sub-route may be cleaner.

---

### Ready for Proposal

Yes. The investigation is complete. The orchestrator should tell the user:

> Exploration done. Recommendation is M2 (measurement points config embedded on Client, log entries in a new `BodyMeasurement` collection). Body diagram via inline SVG with data-driven hotspot coordinates. Trends chart reuses the existing WeightTrendsChart pattern (Recharts AreaChart). Add-record modal supports batch entry (multiple points per session). One open question before proposal: should measurements be a **third tab on `/activity`** or a **new route `/activity/measurements`**? The mock suggests a full-page layout — a dedicated route may be cleaner. Confirm with the user.
