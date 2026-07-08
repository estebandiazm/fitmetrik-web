# Design: Body Measurements Tracking

> **Storage decision** (locked in proposal): **M1 — Fully Embedded**. Both `measurementPoints[]` and `measurements[]` live as subdocument arrays on the existing `Client` document. Volume math (8 points × weekly cadence × 2 years ≈ 830 entries ≈ 66 KB) is well below MongoDB's 16 MB cap. The exploration document's M2 recommendation is explicitly deferred — if real-world cadence proves daily, we migrate to a sibling collection in a follow-up change. Schema shapes are designed to be structurally compatible with such a migration.

---

## 1. Domain Layer (`src/domain/`)

### 1.1 New file: `src/domain/types/MeasurementPoint.ts`

```ts
import { z } from "zod";

export const BodyCoordsSchema = z.object({
  x: z.number().min(0).max(100),  // % across SVG viewBox horizontally
  y: z.number().min(0).max(100),  // % across SVG viewBox vertically
});

export const MeasurementPointSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/, {
    message: "Slug must be lowercase kebab-case",
  }),
  label: z.string().min(1).max(60),
  bodyCoords: BodyCoordsSchema,
  active: z.boolean(),
  minCm: z.number().positive(),
  maxCm: z.number().positive(),
}).refine((p) => p.maxCm > p.minCm, {
  message: "maxCm must be greater than minCm",
  path: ["maxCm"],
});

export type BodyCoords = z.infer<typeof BodyCoordsSchema>;
export type MeasurementPoint = z.infer<typeof MeasurementPointSchema>;
```

**Slug semantics**

- `slug` is the **stable identifier** — never renamed once written. It's the foreign key from `BodyMeasurement.pointSlug` and the key used by `BodyDiagram` to render hotspots.
- `label` is **display-only** and may be re-edited later (e.g. switching language or fixing a typo) without invalidating historical data.
- The 8 v1 slugs are seeded once from `MEASUREMENT_POINTS_CATALOG` (see §2). Coach can toggle `active` per client; they cannot add a custom slug in v1.

### 1.2 New file: `src/domain/types/BodyMeasurement.ts`

```ts
import { z } from "zod";

export const BodyMeasurementSchema = z.object({
  date: z.coerce.date(),
  pointSlug: z.string().min(1),
  valueCm: z.number().positive().max(300, {
    message: "valueCm must not exceed 300 cm",
  }),
  notes: z.string().max(280).optional(),
}).refine((m) => m.date.getTime() <= Date.now(), {
  message: "Date cannot be in the future",
  path: ["date"],
});

export type BodyMeasurement = z.infer<typeof BodyMeasurementSchema>;
```

Mirrors `DailyWeightSchema`'s pattern: structural validation in the schema + a `.refine()` for the dynamic past-or-today constraint. The hard 300 cm ceiling is a safety net; per-point ranges (§1.4) are the real validation.

### 1.3 Extend `src/domain/types/Client.ts`

```ts
import { DietPlan } from "./DietPlan";
import { DailyStep } from "./DailySteps";
import { DailyWeight } from "./DailyWeight";
import { MeasurementPoint } from "./MeasurementPoint";
import { BodyMeasurement } from "./BodyMeasurement";

export interface Client {
  name: string;
  targetWeight?: number;
  coachId: string;
  authId?: string;
  plans: DietPlan[];
  dailySteps?: DailyStep[];
  dailyWeights?: DailyWeight[];
  stepGoal?: number;
  measurementPoints?: MeasurementPoint[];
  measurements?: BodyMeasurement[];
  updatedAt?: string | Date;
}
```

Both new arrays are `optional` — pre-existing Client docs in MongoDB simply resolve to `undefined` and are treated as empty. No migration script needed (per §3).

### 1.4 New file: `src/domain/services/bodyMeasurements.ts`

Pure helpers, no React, no infra. Every function < 20 lines, early returns, no magic numbers.

```ts
import { MeasurementPoint } from "@/domain/types/MeasurementPoint";
import { BodyMeasurement } from "@/domain/types/BodyMeasurement";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

// 1. Per-point range check (defence-in-depth against schema's hard ceiling)
export function validateMeasurement(
  point: MeasurementPoint,
  valueCm: number
): ValidationResult {
  if (valueCm < point.minCm) {
    return { ok: false, reason: `Value below minimum (${point.minCm} cm)` };
  }
  if (valueCm > point.maxCm) {
    return { ok: false, reason: `Value above maximum (${point.maxCm} cm)` };
  }
  return { ok: true };
}

// 2. Group measurements by slug for chart/history lookups
export function groupByPoint(
  measurements: BodyMeasurement[]
): Record<string, BodyMeasurement[]> {
  const grouped: Record<string, BodyMeasurement[]> = {};
  for (const m of measurements) {
    const list = grouped[m.pointSlug] ?? [];
    list.push(m);
    grouped[m.pointSlug] = list;
  }
  return grouped;
}

// 3. Delta vs previous entry for the same point (sorted by date desc)
export function getDeltaForLast(
  measurements: BodyMeasurement[],
  pointSlug: string
): number | null {
  const forPoint = measurements
    .filter((m) => m.pointSlug === pointSlug)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  if (forPoint.length < 2) return null;
  return Number((forPoint[0].valueCm - forPoint[1].valueCm).toFixed(1));
}

// 4. Seed catalog factory — returns the 8 default points (active=false)
export function seedCatalog(): MeasurementPoint[] {
  return MEASUREMENT_POINTS_CATALOG.map((p) => ({ ...p, active: false }));
}
```

`MEASUREMENT_POINTS_CATALOG` constant is defined inside this same module (§2) so the seed is colocated with the helpers that consume it.

---

## 2. Seed Catalog Data

Inline `MEASUREMENT_POINTS_CATALOG` constant in `src/domain/services/bodyMeasurements.ts`. Coordinates target a **100 × 100** virtual grid that maps onto the SVG viewBox `0 0 100 100` (see §9). Front-view, anatomically symmetric — limb points are nominally shown on the **left side** of the silhouette (anatomical right) and visually correspond to either arm/leg.

| slug | label (es) | bodyCoords (x, y) | minCm | maxCm | rationale |
|---|---|---|---|---|---|
| `pecho` | Pecho | `(50, 28)` | 60 | 200 | Chest circumference at nipple line — trunk |
| `cintura` | Cintura | `(50, 45)` | 50 | 200 | Narrowest point above navel — trunk |
| `gluteo` | Glúteo | `(50, 56)` | 60 | 200 | Widest hip/glute line — trunk |
| `cuadriceps-alto` | Cuádriceps Alto | `(40, 64)` | 30 | 100 | Upper thigh, ~5 cm below glute crease — limb |
| `cuadriceps-bajo` | Cuádriceps Bajo | `(40, 76)` | 25 | 90 | Lower thigh, just above knee — limb |
| `pantorrilla` | Pantorrilla | `(40, 88)` | 20 | 70 | Widest calf — limb |
| `biceps-relajado` | Bíceps Relajado | `(28, 35)` | 15 | 60 | Upper arm circumference, relaxed — limb |
| `biceps-contraido` | Bíceps Contraído | `(28, 37)` | 15 | 65 | Upper arm circumference, flexed — limb |

```ts
export const MEASUREMENT_POINTS_CATALOG: ReadonlyArray<
  Omit<MeasurementPoint, "active">
> = [
  { slug: "pecho",             label: "Pecho",             bodyCoords: { x: 50, y: 28 }, minCm: 60, maxCm: 200 },
  { slug: "cintura",           label: "Cintura",           bodyCoords: { x: 50, y: 45 }, minCm: 50, maxCm: 200 },
  { slug: "gluteo",            label: "Glúteo",            bodyCoords: { x: 50, y: 56 }, minCm: 60, maxCm: 200 },
  { slug: "cuadriceps-alto",   label: "Cuádriceps Alto",   bodyCoords: { x: 40, y: 64 }, minCm: 30, maxCm: 100 },
  { slug: "cuadriceps-bajo",   label: "Cuádriceps Bajo",   bodyCoords: { x: 40, y: 76 }, minCm: 25, maxCm: 90 },
  { slug: "pantorrilla",       label: "Pantorrilla",       bodyCoords: { x: 40, y: 88 }, minCm: 20, maxCm: 70 },
  { slug: "biceps-relajado",   label: "Bíceps Relajado",   bodyCoords: { x: 28, y: 35 }, minCm: 15, maxCm: 60 },
  { slug: "biceps-contraido",  label: "Bíceps Contraído",  bodyCoords: { x: 28, y: 37 }, minCm: 15, maxCm: 65 },
] as const satisfies ReadonlyArray<Omit<MeasurementPoint, "active">>;
```

> **Note on coordinate tuning**: coords are starting values calibrated to a generic vitruvian silhouette. During `apply`, the implementer overlays the SVG (§9) and nudges the values until each hotspot visually sits on the correct anatomical landmark. Because coords are data — not JSX — this is a single-line edit per point, no component rewrite.

---

## 3. Mongoose Model (`src/lib/models/Client.ts`)

Two new sub-schemas mirroring the `DailyStepsSchema` / `DailyWeightSchema` pattern (no `_id` on subdocs, embedded array on `Client`):

```ts
const MeasurementPointSchema = new Schema({
  slug:       { type: String, required: true },
  label:      { type: String, required: true },
  bodyCoords: {
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
  },
  active:     { type: Boolean, required: true, default: false },
  minCm:      { type: Number, required: true },
  maxCm:      { type: Number, required: true },
}, { _id: false });

const BodyMeasurementSchema = new Schema({
  date:      { type: Date,   required: true },
  pointSlug: { type: String, required: true },
  valueCm:   { type: Number, required: true, min: 0.1, max: 300 },
  notes:     { type: String },
}, { _id: false });
```

Wire into `ClientSchema`:

```ts
const ClientSchema = new Schema<ClientDocument>({
  // …existing fields…
  measurementPoints: { type: [MeasurementPointSchema], default: [] },
  measurements:      { type: [BodyMeasurementSchema],  default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
```

Update the `ClientDocument` interface:

```ts
export interface ClientDocument extends Omit<
  IClient,
  'plans' | 'coachId' | 'authId' | 'dailySteps' | 'dailyWeights'
                       | 'measurementPoints' | 'measurements'
>, Document {
  // …existing fields…
  measurementPoints: Array<MeasurementPoint>;
  measurements:      Array<BodyMeasurement>;
}
```

### Migration considerations

- **No migration script needed.** Mongoose's `default: []` resolves an absent field to an empty array on read. New documents written via `createClient()` get explicit `measurementPoints: []` and `measurements: []`.
- **Backfill of the catalog**: NOT done in DB. The first time a coach opens the `MeasurementPointsEditor` for a client, the editor merges the static `MEASUREMENT_POINTS_CATALOG` with the client's existing `measurementPoints[]` (matched by `slug`) so newly added catalog points appear automatically. Coach saves → only then is the merged array persisted.
- **Projection hint**: list/roster queries (`getClients`, `getClientsByCoachId`) do **not** need measurement data. Add `.select('-measurements -measurementPoints')` projection there to avoid sending heavy arrays to roster screens. The single-client routes (`getClientById`, activity page) load everything. This mitigates the document-bloat-at-the-edge risk called out in the proposal.

---

## 4. Server Actions (`src/app/actions/clientActions.ts`)

All actions follow the existing `addDailyStep` / `addDailyWeight` pattern: `'use server'` is already declared at file top, `dbConnect()` first, Zod `safeParse` for validation, `findById → mutate → save` for embedded-array writes, return value runs through `toClient()`.

> The orchestrator prompt lists `addMeasurementEntries` and `getMeasurementsByPoint` as the names to use. We retain those exact names.

### 4.1 `setMeasurementPoints(clientId, points)`

```ts
export async function setMeasurementPoints(
  clientId: string,
  points: MeasurementPoint[]
): Promise<(Client & { id: string }) | null>
```

- Coach replaces the **full configured list**. The UI sends all 8 catalog entries with their `active` toggles set; this action just writes the array verbatim.
- Validate each entry via `MeasurementPointSchema.safeParse()`. Reject on first failure.
- Reject if any slug is not in the catalog (defence against tampered input).
- `findByIdAndUpdate(clientId, { measurementPoints: points }, { new: true })`.

### 4.2 `addMeasurementEntries(clientId, entries)`

```ts
export async function addMeasurementEntries(
  clientId: string,
  entries: BodyMeasurement[]
): Promise<(Client & { id: string }) | null>
```

- Client logs **one or many** measurements in a single call (batch). Mirrors `addDailyStep` but loops.
- Per entry:
  1. `BodyMeasurementSchema.safeParse(entry)` — throws on structural failure.
  2. Look up `MeasurementPoint` by `entry.pointSlug` on the loaded client doc; if not found OR `active === false`, throw `Measurement point not configured for this client`.
  3. `validateMeasurement(point, entry.valueCm)` — throws on range failure.
  4. Normalise `date` to `00:00:00` local (same pattern as `addDailyStep`).
  5. **Upsert by `(date, pointSlug)`**: find the existing entry with the same day and slug; if present, replace; else push.
- Single `doc.save()` at the end of the loop — one round-trip even for an 8-point batch.

### 4.3 `getMeasurementsByPoint(clientId, pointSlug)`

```ts
export async function getMeasurementsByPoint(
  clientId: string,
  pointSlug: string
): Promise<BodyMeasurement[]>
```

- `findById(clientId)`, filter `doc.measurements` by `pointSlug`, sort by `date` desc, return.
- Pure JS filter (matches existing `getDailyStepsRange` style).

### 4.4 Auth

All three actions reuse the existing pattern: the Server Actions themselves do **not** re-check Supabase auth (that's the route/page's job, e.g. `(dashboard)/clients/[clientId]/page.tsx` already validates the coach owns the client before rendering). For coach-facing actions called from coach pages, ownership is enforced upstream. For client-side calls from `(client-portal)`, the page is already gated by the auth middleware and the `authId` lookup. This matches `setStepGoal` / `addDailyWeight` exactly — no new auth surface introduced.

### 4.5 `toClient()` update

Append the two arrays to the returned plain object:

```ts
return {
  id: String(plain._id),
  // …existing fields…
  measurementPoints: plain.measurementPoints ?? [],
  measurements:      plain.measurements ?? [],
  updatedAt: new Date(plain.updatedAt),
};
```

---

## 5. API Route (`src/app/api/clients/[clientId]/tracking/route.ts`)

Extend `TrackingEntrySchema` with an optional `measurements[]` field. Fully backward-compatible.

```ts
const TrackingEntrySchema = z
  .object({
    date: z.coerce.date(),
    steps:        z.number().int().min(0).max(100000).optional(),
    weight:       z.number().min(0.1).max(500).optional(),
    measurements: z.array(z.object({
      pointSlug: z.string().min(1),
      valueCm:   z.number().positive().max(300),
      notes:     z.string().max(280).optional(),
    })).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (d) =>
      d.steps !== undefined ||
      d.weight !== undefined ||
      (d.measurements && d.measurements.length > 0),
    { message: "At least steps, weight, or measurements must be provided" }
  );
```

POST handler additions (after the existing `if (entry.weight !== undefined)` block):

```ts
if (entry.measurements && entry.measurements.length > 0) {
  const built = entry.measurements.map((m) => ({
    date: entry.date,
    pointSlug: m.pointSlug,
    valueCm: m.valueCm,
    notes: m.notes ?? entry.notes,
  }));
  const result = await addMeasurementEntries(clientId, built);
  if (!result) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  results.measurements = built.length;
}
```

- `x-api-key` header auth (already in place) is unchanged. **Confirm** during `apply` that the middleware exclusion in `src/middleware.ts` still keeps `/api/clients/*/tracking` out of the auth wall — verified post-fix in the recent `fix/middleware-api-routes-exclusion` PR.
- The response payload includes `measurements: <count>` when present, mirroring how `steps` and `weight` echo their value.
- Validation failures (range, unknown slug, inactive point) propagate from `addMeasurementEntries` as a thrown error → caught by the route's generic `try/catch` → 500. For better UX we could surface a 400 with the message, but matching today's existing handler behaviour for the comparable `addDailyStep` flow keeps this consistent. Improvement deferred.

---

## 6. UI Components (`src/components/activity/`)

All new components are `'use client'`, follow React 19 rules (NO `useMemo` / `useCallback` / `memo()` — the compiler handles memoisation), use Tailwind 4 with the `cn()` helper, and wrap in `GlassCard` where applicable to match Steps/Weight tabs.

### 6.1 `BodyDiagram.tsx`

**Props**

```ts
interface BodyDiagramProps {
  points: MeasurementPoint[];     // already filtered or full list
  selectedSlug?: string;
  onSelect: (slug: string) => void;
}
```

**Behaviour**

- Renders the inline silhouette SVG (§9) as a child component.
- Overlays each `point` where `active === true` as a `<button>` wrapping an SVG `<circle>` at `cx={point.bodyCoords.x}` `cy={point.bodyCoords.y}` on the shared `viewBox="0 0 100 100"`.
- Inactive points are NOT rendered — neither greyed nor present. The editor (§7) controls activation.
- Selected hotspot gets a tailwind glow: `drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]` plus an outer ring `<circle r="2.5" />` pulse animation; non-selected get a subtle `drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]`.
- Each hotspot has `data-testid="body-diagram-point-{slug}"` for Playwright.
- Hotspot `<button>` has `aria-label={point.label}` and `aria-pressed={selectedSlug === point.slug}` for a11y.
- Container sizing: `aspect-[1/2]` (silhouette is taller than wide) inside a `max-w-xs` flex column; SVG fills the box via `width="100%" height="100%"`.

### 6.2 `MeasurementTrendsChart.tsx`

**Props**

```ts
interface MeasurementTrendsChartProps {
  measurements: BodyMeasurement[];   // all entries for the client
  activePoints: MeasurementPoint[];  // active points only — drives the selector
  selectedSlug: string;
  onSelectedSlugChange: (slug: string) => void;
}
```

**Behaviour**

- Recharts `AreaChart` rendering only the `measurements` whose `pointSlug === selectedSlug`. Mirrors `WeightTrendsChart` structurally.
- Top-right has a `<select>` dropdown (NOT a tab row — we already have tabs at the page level for Steps/Weight/Measurements). The dropdown lists `activePoints` by `label`.
- Period toggle (Week / Month) reused from `WeightTrendsChart` — same `useState<'month' | 'week'>` pattern.
- Chart data generation re-uses the per-day windowing loop from `WeightTrendsChart` (gaps stay `null` so `connectNulls={false}` draws a broken line where the client missed a day).
- **Formatter null-safety** (regression mitigation — see TrendsChart fix on this branch):
  ```ts
  formatter={(value) =>
    value != null ? [`${value} cm`, label] : ['No data', label]
  }
  ```
  Same defensive pattern locked in for the weight chart in commit `b64b9e0`.
- `GlassCard` wrapper, `data-testid="measurement-trends-chart"`.

### 6.3 `MeasurementHistory.tsx`

**Props**

```ts
interface MeasurementHistoryProps {
  measurements: BodyMeasurement[]; // for the selected point only, OR full list with a slug filter
  pointLabel: string;
}
```

**Behaviour**

- Renders a table: `Fecha · Medida (cm) · Cambio Δ`.
- Sorted desc by `date`. Delta is `current.valueCm − previous.valueCm` (with `previous` being the next-older entry for the same slug — already filtered by the parent).
- Delta cell styling:
  - Δ < 0 → green text + ▼ icon (`text-emerald-400`)
  - Δ > 0 → red text + ▲ icon (`text-rose-400`)
  - Δ === 0 → neutral grey (`text-gray-400`)
  - First/only entry → `—`
- Empty state: `<p>Sin registros todavía</p>`.
- `data-testid="measurement-history"` on the wrapper; each row has `data-testid="measurement-history-row-{index}"`.

### 6.4 `AddMeasurementModal.tsx`

**Props**

```ts
interface AddMeasurementModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  activePoints: MeasurementPoint[];
  preselectedSlug?: string;        // when opened from a body-diagram hotspot
  onSuccess: () => void;
}
```

**Behaviour**

- Modal layout mirrors `DailyWeightModal` (full-screen on mobile, centered on desktop).
- Body: a date picker (defaults to today, max=today) + a list of inputs — **one row per active point**.
- Each row: `<label>{point.label}</label> <input type="number" step="0.1" min={point.minCm} max={point.maxCm} />`. An empty input means "don't log this point this session".
- `preselectedSlug` (passed when the modal opens from a `BodyDiagram` hotspot click) focuses that input on mount.
- Submit collects all rows where input is non-empty into `BodyMeasurement[]`, validates each via `validateMeasurement` for inline feedback BEFORE calling the Server Action, and calls `addMeasurementEntries(clientId, entries)`.
- `useActionState` + `useFormStatus` from React 19 for form/submission state (preferred over `useState` for forms here).
- A "force override" toggle (§proposal risk) is **deferred to v1.1** — design accepts only in-range values for now.
- `data-testid="add-measurement-modal"`, each row `data-testid="add-measurement-input-{slug}"`, submit `data-testid="add-measurement-submit"`.

---

## 7. Coach Configuration UI (`src/components/coach/`)

### 7.1 `MeasurementPointsEditor.tsx`

**Props**

```ts
interface MeasurementPointsEditorProps {
  clientId: string;
  currentPoints: MeasurementPoint[];  // what the client has now (possibly empty)
  onSaved?: () => void;
}
```

**Behaviour**

- On mount, merge `MEASUREMENT_POINTS_CATALOG` with `currentPoints` by `slug`: catalog entries provide defaults, current entries provide the `active` flag (if a point was previously saved). Newly-added catalog points appear with `active: false`.
- Renders a checklist (one row per catalog entry) with a Tailwind toggle (`<input type="checkbox" />` styled as a switch) labelled by `point.label`.
- Save button calls `setMeasurementPoints(clientId, merged)`. Success/error messaging follows `WeightGoalEditor`'s exact UX pattern (green confirmation + red error chip).
- **Deactivation guardrail** (proposal risk): if the user toggles a point OFF whose slug already has entries in `client.measurements`, show an inline confirmation: `"Tienes N registros para este punto. Se ocultará pero los datos no se eliminarán. ¿Continuar?"`. The history table (§6.3) keeps showing those entries even when the point is inactive.
- `data-testid="measurement-points-editor"`, each toggle `data-testid="measurement-point-toggle-{slug}"`.

### 7.2 Wiring in `(dashboard)/clients/[clientId]/page.tsx`

Append a third Mongoose-data section AFTER the existing "Weight Tracking Section" (lines 134–190 today):

```tsx
{/* Body Measurements Section */}
<div className="space-y-6 mt-8">
  <h2 className="text-xl font-bold text-white">Body Measurements</h2>

  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
    <h3 className="text-lg font-semibold text-white mb-4">Measurement Points</h3>
    <MeasurementPointsEditor
      clientId={clientId}
      currentPoints={client.measurementPoints ?? []}
    />
  </div>

  {(client.measurements?.length ?? 0) > 0 && (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Coach View — All Measurements</h3>
      {/* Optional: render MeasurementHistory grouped by point */}
    </div>
  )}
</div>
```

(`page.tsx` already fetches `client` via `getClientById(clientId)`; with `toClient()` updated per §4.5, both arrays are available with no additional fetch.)

---

## 8. Activity Tab Integration (`src/components/activity/ActivityPageClient.tsx`)

### 8.1 Tab signature

```ts
type Tab = 'steps' | 'weight' | 'measurements';
```

`initialTab` URL parser extends to `searchParams.get('tab') === 'measurements'`.

### 8.2 Props

```ts
interface ActivityPageClientProps {
  clientId: string;
  clientName: string;
  dailySteps: DailyStep[];
  dailyWeights: DailyWeight[];
  measurementPoints: MeasurementPoint[];
  measurements: BodyMeasurement[];
  stepGoal?: number;
  targetWeight?: number;
  onRefresh?: () => void;
}
```

The parent server component (`(client-portal)/activity/page.tsx`) reads `client.measurementPoints` and `client.measurements` via the already-existing `getClientByAuthId(authId)` call → no new fetch needed (the data is already returned by the updated `toClient()`).

### 8.3 Tab bar

Add a third button next to Steps/Weight:

```tsx
<button
  onClick={() => handleTabChange('measurements')}
  className={cn(
    'px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px',
    activeTab === 'measurements'
      ? 'text-emerald-400 border-emerald-400'
      : 'text-gray-400 border-transparent hover:text-white'
  )}
  data-testid="activity-tab-measurements"
>
  <span className="material-symbols-outlined text-base align-middle mr-1">
    straighten
  </span>
  Medidas Corporales
</button>
```

(Emerald-400 picked deliberately to differentiate from pink/Steps and blue/Weight.)

### 8.4 Tab content

Local state inside the tab:

```ts
const activePoints = measurementPoints.filter((p) => p.active);
const [selectedSlug, setSelectedSlug] = useState<string>(
  activePoints[0]?.slug ?? ''
);
const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
```

Layout (top → bottom, single column on mobile, two-column on `lg:`):

```
+--------------------------------------------+
|  GlassCard: BodyDiagram                    |   GlassCard: MeasurementTrendsChart
|  (left, ~1/3 width on lg)                  |   (right, ~2/3 width on lg)
+--------------------------------------------+
|  GlassCard: MeasurementHistory (full width)                                    |
+----------------------------------------------------------------------------- -+
```

The page-level "+ Add Record" button (already present in the header at line 74-84) is reused — its click handler now opens `AddMeasurementModal` when `activeTab === 'measurements'`. If `activePoints` is empty, the button shows a tooltip / disabled state with the message "Tu coach aún no configuró puntos de medición".

A hotspot click on `BodyDiagram` sets `selectedSlug` (drives chart + history) AND opens the modal with `preselectedSlug={slug}`. Two interactions in one tap — matches the design.

### 8.5 Empty states

- No `activePoints` configured → render `<EmptyState>` card with copy "Tu coach todavía no configuró puntos de medición. Pedile que active al menos uno." and disable the Add Record button.
- `activePoints` exist but no `measurements` → diagram renders fine; chart shows the empty grid; history shows "Sin registros todavía".

---

## 9. SVG Silhouette Asset

**Decision: inline React component, NOT a static file.**

Why:

1. The hotspots are drawn **on top** of the silhouette in the same SVG so that the `viewBox` coordinate space is shared. An external `<img>` or `next/image` element would force the hotspot layer into its own coordinate space and create alignment drift across breakpoints.
2. Inline SVG composes with Tailwind classes for theming (`fill-white/20`, `stroke-white/40`, `dark:fill-…`).
3. Zero new build assets, zero new asset pipeline considerations.

### Component shape

`src/components/activity/BodyDiagramSilhouette.tsx` (separate file from `BodyDiagram.tsx` for clarity):

```tsx
export function BodyDiagramSilhouette() {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Silueta corporal"
      className="text-white/30"
    >
      {/* Head */}
      <circle cx="50" cy="10" r="6" fill="currentColor" />
      {/* Neck */}
      <rect x="47" y="16" width="6" height="4" fill="currentColor" />
      {/* Torso (trapezoidal) */}
      <path d="M 35 20 L 65 20 L 60 55 L 40 55 Z" fill="currentColor" opacity="0.85" />
      {/* Arms — left */}
      <path d="M 35 22 L 25 28 L 22 50 L 28 52 Z" fill="currentColor" opacity="0.75" />
      {/* Arms — right (mirror) */}
      <path d="M 65 22 L 75 28 L 78 50 L 72 52 Z" fill="currentColor" opacity="0.75" />
      {/* Hips */}
      <path d="M 38 55 L 62 55 L 64 62 L 36 62 Z" fill="currentColor" opacity="0.85" />
      {/* Legs — left */}
      <path d="M 38 62 L 46 62 L 44 92 L 38 92 Z" fill="currentColor" opacity="0.85" />
      {/* Legs — right */}
      <path d="M 54 62 L 62 62 L 62 92 L 56 92 Z" fill="currentColor" opacity="0.85" />
      {/* Feet */}
      <rect x="36" y="92" width="9"  height="4" fill="currentColor" opacity="0.85" />
      <rect x="55" y="92" width="9"  height="4" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
```

`BodyDiagram.tsx` composes it:

```tsx
<div className="relative w-full aspect-[1/2] max-w-xs mx-auto">
  <svg viewBox="0 0 100 100" className="absolute inset-0">
    <BodyDiagramSilhouette />
    {points.filter((p) => p.active).map((p) => (
      <g key={p.slug} data-testid={`body-diagram-point-${p.slug}`}>
        <circle
          cx={p.bodyCoords.x}
          cy={p.bodyCoords.y}
          r="1.8"
          className={cn(
            "fill-pink-500 cursor-pointer transition",
            selectedSlug === p.slug && "drop-shadow-[0_0_3px_rgba(236,72,153,1)]"
          )}
          onClick={() => onSelect(p.slug)}
          role="button"
          aria-label={p.label}
          aria-pressed={selectedSlug === p.slug}
        />
      </g>
    ))}
  </svg>
</div>
```

> `<circle>` inside an SVG can carry click handlers and ARIA, satisfying the accessibility requirement without an outer `<button>` wrapper.

The silhouette is intentionally **minimalist and stylised** — not anatomically photorealistic. It is a navigation guide for hotspots, not an illustrative asset. If product later wants a richer silhouette, only this component changes — the hotspot logic is unaffected.

---

## 10. Testing Strategy

> **Strict TDD Mode is ACTIVE.** Tests must be written FIRST and FAIL before any implementation code is written for the corresponding feature.

### 10.1 Playwright E2E (`tests/e2e/`)

Required test file: `body-measurements.spec.ts`. Page Object Models in `tests/e2e/pom/`:

- `CoachClientDetailPage` — extends existing POM. New methods: `toggleMeasurementPoint(slug)`, `saveMeasurementPoints()`, `expectPointActive(slug)`.
- `ActivityPage` — extends existing POM. New methods: `switchToMeasurementsTab()`, `clickBodyDiagramHotspot(slug)`, `fillMeasurementInput(slug, value)`, `submitMeasurements()`, `selectChartPoint(slug)`, `getHistoryRowCount()`.

### Scenarios (high-level, derived from acceptance criteria)

1. **Coach configures points**
   - Login as coach → open client detail → MeasurementPointsEditor visible
   - Toggle ON `cintura`, `pecho`, `biceps-contraido` → Save → success message
   - Reload → toggles persist

2. **Client batch-logs measurements**
   - Login as client → /activity → switch to Measurements tab
   - Body diagram shows 3 hotspots (only active points)
   - Click "+ Agregar Registro" → modal opens
   - Fill `cintura=78`, `pecho=95`, `biceps-contraido=33` → Submit
   - Modal closes, trends chart visible, history table has 3 entries (one per point) when filtered

3. **Switching chart point**
   - With ≥2 measurements per point: select `cintura` from dropdown → chart shows cintura series
   - Select `pecho` → chart re-renders with pecho series
   - History updates to match selected point

4. **Hotspot click pre-selects in modal**
   - Click `cintura` hotspot → modal opens → cintura input has focus

5. **Out-of-range rejection**
   - Try to submit `cintura=300` → inline error "Value above maximum (200 cm)"
   - Modal does NOT submit; no Server Action call

6. **Backward-compat regression — Steps/Weight tabs untouched**
   - Existing `steps.spec.ts` / `weight.spec.ts` pass unchanged
   - Reuse existing POM steps for those flows

7. **API route extension**
   - `tests/api/tracking.spec.ts`: POST with `{ measurements: [{...}] }` + valid API key → 200, doc updated
   - POST with only `{ steps: 5000 }` (legacy) → still 200 (proof of non-breaking)
   - POST with `{ measurements: [{ pointSlug: "unknown" }] }` → 500 (or 400 if we improve handler)

### 10.2 Vitest (aspirational)

Vitest is not configured today. The proposal calls these tests **aspirational only**. Once configured, target:

- `domain/services/bodyMeasurements.test.ts` — `validateMeasurement`, `groupByPoint`, `getDeltaForLast`, `seedCatalog`
- `domain/types/BodyMeasurement.test.ts` — `BodyMeasurementSchema.refine()` rejects future dates

Do NOT block the change on Vitest setup; the playwright suite is the strict-TDD gate.

### 10.3 Test discipline (mandatory per strict-tdd)

For each feature slice in the tasks breakdown:

1. Write the failing Playwright test FIRST (red).
2. Implement the minimum code to make it pass (green).
3. Refactor if needed (refactor).
4. Move to the next slice.

Sub-agents in `sdd-apply` MUST follow this loop. The `sdd-verify` agent will check that test files exist and pass against the implementation, AND that the commit history shows tests landed before or together with the implementation (not after).

---

## 11. Risks Revisited

| Risk | Status & Mitigation |
|---|---|
| Document size growth at weekly cadence | **Validated**: 66 KB at 2 years for 8 points × weekly. No concern. Path to M2 (sibling collection) is documented; schema shapes are migration-compatible. |
| Deactivating a point with existing history | **Resolved**: deactivation only flips `active=false`. History table (§6.3) renders entries regardless of the parent point's `active` state — historical data is never deleted or hidden. Confirmation prompt in editor (§7.1) warns about the count. |
| API key auth on `/tracking` extension | **Verified**: middleware exclusion (`fix/middleware-api-routes-exclusion`) keeps `/api/clients/*/tracking` outside the auth wall. Apply phase should re-verify via the existing `tracking.spec.ts`. |
| Recharts undefined-value crash | **Mitigated**: `MeasurementTrendsChart` formatter uses the `value != null` guard locked in by commit `b64b9e0` on this branch. Pattern copy-pasted from `WeightTrendsChart`. |
| Coord-tuning fiddly | **Mitigated**: coords are data on `MeasurementPoint`, not JSX. A single-line edit moves a hotspot. Apply phase budgets a visual-tuning task explicitly. |
| Document bloat at roster-level queries | **Mitigated**: §3 specifies Mongoose `.select('-measurements -measurementPoints')` projection for `getClients` / `getClientsByCoachId`. Single-client routes load the full doc. |
| Batch-modal mobile UX | **Mitigated**: each row is `<label> + <input>`, stacked vertically; sticky bottom Save button; per-row inline range hint via `min`/`max` HTML attrs. Playwright covers a 3-point batch submit (§10.1, scenario 2). |
| Measurement catalog drift | **Mitigated**: `MeasurementPointsEditor` merges catalog with stored points by slug on mount, so adding a new catalog entry in a future change auto-surfaces it to coaches without a migration. |
| Forced override of out-of-range values | **Deferred to v1.1.** v1 hard-rejects out-of-range. Proposal mentioned a forced-override flag; design explicitly defers it to keep the modal simple. |

---

## 12. Non-goals (recap from proposal)

- No dashboard widget for measurements (defer).
- No cross-point overlay chart (defer).
- No DB-configurable per-point ranges (in code only).
- No photo attachments.
- No body-fat % / composition formulas (raw cm only).
- No coach-extensible catalog (8 fixed seeds in v1).
- No reminders / scheduled measurement nudges.
- No migration of historical data (empty arrays on existing docs).
- No new collection for `BodyMeasurement` in v1 (M1 embedded; M2 deferred).

---

## 13. Architectural Alignment Summary

- **Dependency rule**: respected. `domain/services/bodyMeasurements.ts` imports only Zod-derived types from `domain/types/`. Server Actions and components import from `domain/` downward. `infrastructure/` (Mongoose model) imports from `domain/types/`. Nothing in `domain/` reaches up.
- **Server Components by default**: `(dashboard)/clients/[clientId]/page.tsx` and `(client-portal)/activity/page.tsx` remain server components. The new `MeasurementPointsEditor`, `ActivityPageClient` (already exists), `BodyDiagram`, `MeasurementTrendsChart`, `MeasurementHistory`, and `AddMeasurementModal` are `'use client'` because they have interactivity.
- **Server Actions for mutations**: `setMeasurementPoints`, `addMeasurementEntries`, `getMeasurementsByPoint` colocated in `src/app/actions/clientActions.ts`.
- **Zod first**: every domain boundary (Server Action input, API route body) uses `.safeParse()`. Future-date rule uses `.refine()` since `Date.now()` is dynamic.
- **TypeScript strict**: all schemas exported as `z.infer<>`; the catalog uses `satisfies` to enforce shape without widening.
- **Tailwind 4**: `cn()` for conditional classes; no `var()` strings; theme tokens stay in `@theme {}`.
- **Playwright + data-testid + POM**: spelled out in §10.
- **Clean code**: every helper < 20 lines; English names except for user-visible Spanish labels; early returns; no magic numbers (ranges live in the catalog as named fields, not literals in code).

---

## Open Questions for Apply Phase

None. All architectural decisions are locked. The remaining unknowns are visual-tuning (coord nudging, copy text) that resolve during implementation against the live design.
