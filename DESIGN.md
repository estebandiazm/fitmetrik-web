---
name: FitMetrik — Blíster de Adherencia
description: A clinical-trustworthy blister-pack dosing metaphor for daily nutrition adherence tracking.
colors:
  bg: "#f4f6f8"
  panel: "#ffffff"
  border: "#e1e4e7"
  border-strong: "#c7ccd1"
  row-border: "#eef0f2"
  text-primary: "#1c2733"
  text-muted: "#6b7680"
  text-faint: "#9aa3ac"
  accent-teal: "#2dd4bf"
  accent-teal-ink: "#063d38"
  accent-amber: "#f59e0b"
  locked-bg: "#eceef0"
  locked-border: "#e1e4e7"
  danger: "#dc6a4a"
  cell-pending-bg: "#ffffff"
typography:
  display:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  mono-data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  control: "8px (client surface: 12px)"
  card: "12px (coach surface: 10px; client surface: 16px)"
  cell-sm-md: "6px / 10px"
  cell-lg: "50%"
  pill: "9999px"
spacing:
  card-p: "1rem (coach: 0.75rem; client: 1.5rem)"
components:
  button-accent:
    backgroundColor: "{colors.accent-teal}"
    textColor: "{colors.accent-teal-ink}"
    rounded: "{rounded.control}"
    padding: "10px 24px"
  button-surface:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.control}"
    padding: "10px 24px"
  card-default:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-p}"
  badge-success:
    backgroundColor: "{colors.accent-teal}"
    textColor: "{colors.accent-teal}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-error:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: FitMetrik — Blíster de Adherencia

## Overview

**Creative North Star: "The Pharmacy Blister Pack"**

A nutrition plan is not a document to read — it's a dose to take. Every day is a cell in a blister pack that the client "pops" or leaves un-popped, and the coach's job is to scan a roster for cells that went un-popped. This world explicitly refuses the generic fitness/SaaS dashboard of flat cards and stat-tile grids: its structural atom is not a stat card, it's a single dosing cell with exactly four legible states (domed/pending, punched/popped, crossed-out/missed, locked/future).

The palette reads clinical-trustworthy, not sterile-cold: a pale foil-grey base (`#F4F6F8`) with silver divider lines (`#C7CCD1`), one accent color per tracked metric rather than per client (teal for weight, amber for steps/activity). Numerals are tabular and set in a monospace face everywhere a count or dose matters ("4/7 esta semana"), while UI labels stay in a compact sans. The system is fully theme-aware (light + dark via a `data-theme` attribute), with dark mode built from the same material logic as light — a blister foil under dim light, not a generic inverted theme.

This system covers the client "Hoy" dashboard (today's dose cell as the focal action, then steps/hydration/macros and the plan), the coach roster (one row per client with its week strip, most-empty-first), the auth screens (animated blister-sheet backdrop, brand panel that fills a week strip, form card), the shared `AppHeader`/nav chrome, the `BlisterCell` primitive, inline stroke icons (`components/ui/icons.tsx`) and the re-skinned atomic layer (`Button`, `Card`, `Input`, `Badge`, `StatusPill`, `Modal`, `Table`, `Alert`). `/activity`, `/creator`, `/coaches` and the client detail page have not been redesigned yet, but the legacy Material token names (`surface-*`, `on-surface*`, `primary`, `error`…) are now aliases of the blister tokens, so they follow light/dark theming too.

**Key Characteristics:**
- One structural atom (the blister cell) with four named, unambiguous states — never a bare empty box standing in for "missed"
- One accent per tracked metric, not per client or per brand mood
- Tabular, monospace numerals for every count/dose value
- Light and dark are both first-class, generated from the same "foil under light" material logic
- Soft, embossed/debossed shadow language (dome-out for pending, punch-in for popped) rather than flat fills or hard offset shadows

## Colors

The palette is a quiet clinical neutral with exactly two metric accents; it is not a brand-color system in the traditional sense — teal and amber are assigned to data types (weight, steps), not to brand identity.

### Primary
- **Blíster Teal** (`#2dd4bf`, dark-theme variant `#34e6cf`): the weight-tracking accent — popped `BlisterCell` fill, the client dashboard's hero interaction, active-state badges, links, and focus rings across both surfaces.

### Secondary
- **Dosage Amber** (`#f59e0b`, dark-theme variant `#ffb020`): reserved for the steps/activity metric track, parallel to teal's role for weight — the dashboard's steps card (icon + progress bar) is its first consumer.

### Neutral
- **Foil Grey** (`#f4f6f8`, background): the page/app background, read as the blister pack's foil sheet.
- **Panel White** (`#ffffff`, panel): card and cell-pending background.
- **Hairline Border** (`#e1e4e7`, border): default dividers and input strokes.
- **Silver Divider** (`#c7ccd1`, border-strong): the `BlisterCell`'s pending-state border — the pack's visible seam.
- **Row Hairline** (`#eef0f2`, row-border): table row dividers, lighter than the default border.
- **Ink** (`#1c2733`, text-primary): primary text.
- **Muted Slate** (`#6b7680`, text-muted): secondary text, labels.
- **Faint Slate** (`#9aa3ac`, text-faint): tertiary text, icon strokes on missed/locked cells, sort-indicator glyphs.
- **Locked Grey** (`#eceef0`, locked-bg/border): the `locked` cell state's fill — visually recessed, deliberately duller than pending.
- **Danger Clay** (`#dc6a4a`, danger): the roster's low-adherence (<50%) text color — a warm clay rather than a saturated alarm red, consistent with the clinical-calm palette.

### Named Rules
**The Metric-Not-Client Rule.** Accent color is assigned per tracked metric (teal = weight, amber = steps), never per client or per arbitrary UI mood. A new tracked metric earns its own accent; an existing metric's accent does not vary by client or context.

**The Never-Ambiguous-Empty Rule.** A `missed` day renders with the same bordered box as `pending` plus an explicit faint-slate X icon — it is never represented as a bare empty cell indistinguishable from "not yet due."

## Typography

**Display Font:** IBM Plex Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, monospace fallback)

**Character:** A compact, medical-label sans for UI chrome paired with a tabular monospace for every number that represents a count, dose, or measurement — the pairing reads like a prescription label, not a marketing headline.

### Hierarchy
- **Display/Dose** (bold 700, ~1.5rem, IBM Plex Mono): the "X/7 esta semana" summary number — the system's single largest, most dose-like numeral.
- **Title** (semibold 600, ~1rem, IBM Plex Sans): card/section headings ("Clientes activos").
- **Body** (regular 400, 0.875rem, IBM Plex Sans): primary UI text, table cell content.
- **Mono-data** (medium/semibold 500–600, 0.75rem, IBM Plex Mono): adherence percentages, weight values (`kg`), date labels — any tracked metric value.
- **Label** (bold 700, 0.75rem, IBM Plex Sans, uppercase, 0.1em tracking): section micro-headers like "Peso" above the hero cell.

### Named Rules
**The Tabular Numeral Rule.** Any number representing a tracked metric or count (weight, adherence %, "X/7") renders in IBM Plex Mono, never the sans face — numerals must align visually across rows and states.

## Layout

The client dashboard widget is a single vertically-stacked card: label → large hero cell (`lg`, 168px, circular) → status text → the 7-cell week strip (`md`, 36px, rounded-square) with day-letter labels above each cell → the "X/7 esta semana" dose summary. The coach roster is a dense desktop table where each row carries its own inline 7-cell week strip at `sm` (22px) scale alongside sortable columns (name, meta, week, adherence %, plan status, last update, action link). Default sort is adherence ascending — most-empty-first — so rows needing attention surface without opening each client profile.

Two scoped spatial densities exist via `.surface-coach` / `.surface-client` wrapper classes, each overriding `--radius-card`, `--radius-control`, `--shadow-card`, and `--space-card-p`: the coach surface is denser (10px/8px radii, 0.75rem padding), the client surface more spacious (16px/12px radii, 1.5rem padding) — consistent with the coach-desktop / client-mobile device split in PRODUCT.md.

## Elevation & Depth

This system is a hybrid of soft neumorphic card elevation and a distinct, structural dome/dose shadow vocabulary reserved for `BlisterCell`. Cards (`neu-card`) carry a directional dual soft-shadow (dark offset + faint light offset) that reads as gently raised off the foil background. The `BlisterCell` itself uses a separate, purpose-built shadow pair that is the literal visual mechanism of the metaphor, not decorative elevation: a convex inset highlight for "pending" (undomed blister) and a concave inset shadow for "popped" (punched-through).

### Shadow Vocabulary
- **Card elevation** (`box-shadow: 6px 6px 20px rgba(0,0,0,.35), -6px -6px 20px rgba(255,255,255,.02)`, light-theme variants scoped per surface): ambient lift for `Card`, `Modal`, `Button` (surface/accent variants).
- **Dome (pending cell)** (`--shadow-dome: 0 1px 3px rgba(0,0,0,.08), inset 0 2px 5px rgba(255,255,255,1), inset 0 -4px 8px rgba(0,0,0,.09)`): the un-popped blister bubble. This shadow's visibility is a known finish-polish item in the light theme — the white-on-white dome highlight is inherently a subtle cue even after strengthening; it is not treated as a defect requiring a token change, and future work should not "fix" it by inflating contrast beyond what the real foil/dome material would show.
- **Popped (punched cell)** (`--shadow-popped: inset 0 3px 8px rgba(0,0,0,.18)`): concave, recessed — reads as punched-through foil.

### Named Rules
**The Structural-Not-Decorative Shadow Rule.** `BlisterCell`'s dome/popped shadows encode state, not ambiance — don't apply this shadow pair to anything that isn't a dosing cell, and don't restyle it to chase extra contrast at the cost of the dome-under-foil material logic.

## Shapes

Three corner languages coexist by role: `BlisterCell` is either a rounded square (6px at `sm`, 10px at `md` — reads as a row of pills) or a true circle (50% at `lg` — the tappable hero dome), chosen per the direction contract rather than uniform scaling. Cards and modals use a larger, softer radius (10–16px depending on surface scope). Badges and the client-initial avatar in the roster are fully circular/pill-shaped (`9999px`). Borders are consistently 1–3px (scaled by `BlisterCell` size) in the hairline/silver-divider neutral tones — no heavy or hard-edged strokes.

## Components

### Buttons
- **Shape:** rounded per `--radius-control` (8px default, 12px on the client surface).
- **Primary (`accent`):** teal background (`--color-accent-teal`) with dark teal-ink text (`--color-accent-teal-ink`), bold weight, `px-6 py-2.5` at `md` size.
- **Hover / Active:** scales to 0.98 and swaps to the concave `--shadow-popped` on `:active` — buttons literally "pop" the same way a blister cell does.
- **Secondary (`surface`) / Ghost:** `surface` reuses the neumorphic card shadow with primary text; `ghost` is transparent with muted text that darkens on hover.

### Cards / Containers
- **Corner Style:** `--radius-card` (12px default; 10px coach, 16px client).
- **Background:** panel white (`--color-panel`).
- **Shadow Strategy:** the ambient card elevation shadow (see Elevation & Depth); `padding="none"` variant used when a child (e.g. a table) owns its own internal spacing.
- **Border:** 1px hairline (`--color-border`).

### Inputs / Fields
- **Style:** concave `neu-inset` background (uses `--shadow-popped`) with a transparent border, `--radius-control` corners.
- **Focus:** border shifts to teal accent (`focus:border-accent-teal`), no glow/ring.

### BlisterCell (signature component)
The structural atom of the entire system: a single day's dose. Four states — `pending` (domed, empty, awaiting action), `popped` (teal-filled, concave, white check icon), `missed` (same box as pending, faint-slate X icon — explicitly skipped, never bare-empty), `locked` (recessed grey fill, faint-slate padlock icon, future/unavailable). Three sizes: `sm` (22px, rounded-square, roster mini-strips), `md` (36px, rounded-square, week strips), `lg` (168px, true circle, the tappable dashboard hero). A state transition from `pending`/`missed` into `popped` triggers a 480ms cubic-bezier punch-through scale animation (`blister-pop` keyframe: 1 → 1.22 → 0.94 → 1.05 → 1) — fired only on a genuine transition, never on initial mount, so pages that render already-popped cells (e.g. roster strips) stay still.

### Navigation / Roster
The coach roster (`ClientRosterTable`) is a list, not a table: one row per client inside a single panel (16px radius, row-hairline separators) with a neutral initial avatar, name plus "Último registro: …" line, a `sm` `BlisterCell` week strip, the adherence % in mono (danger <50%, faint <85%, primary otherwise) and the row action isolated behind a divider. Rows are sorted by adherence ascending (most-empty-first). Both portals share `AppHeader`: popped-cell wordmark, a small text nav (teal underline marks the active section), avatar, theme toggle and sign-out; the client portal adds a mobile `BottomNavBar`.

### Motion
Entrances use `.animate-enter` (560ms rise + fade, staggered via `--enter-delay`). The auth screens add a slowly drifting blister sheet whose cells pop in turn, and a brand-panel week strip that fills cell by cell; errors shake once (`shake-x`). Every animation collapses under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** use `BlisterCell`'s four states exactly as named (`pending`/`popped`/`missed`/`locked`) — never introduce a fifth ad hoc state or repurpose an existing one for a different meaning.
- **Do** keep numerals in IBM Plex Mono wherever a tracked metric or count is displayed.
- **Do** assign accent color per metric (teal/weight, amber/steps), not per client, theme mood, or decoration.
- **Do** theme every new color token through both `:root[data-theme="light"]` and `:root[data-theme="dark"]` selectors, following the existing dark-mode derivation logic (same material, dimmer light) rather than a generic inverted palette.

### Don't:
- **Don't** represent a missed/skipped day as a bare empty cell — it must carry the explicit missed-state icon and border treatment so it's never confused with "not yet due."
- **Don't** add hard offset drop-shadows (flat, non-inset, high-contrast) anywhere in this system — elevation here is soft dual-direction neumorphic lift or concave/convex insets, never a hard neobrutalist-style offset shadow.
- **Don't** use glyph icon fonts (Material Symbols) or emoji on redesigned surfaces — icons are the inline stroke SVGs in `components/ui/icons.tsx`. The only eyebrow style is the artboards' small uppercase faint label (12–13px, 600, 0.08em tracking) above a heading.
- **Don't** treat `--shadow-dome`'s light-theme subtlety as something to "fix" with higher contrast — it is a known, accepted finish-polish characteristic of the white-dome-on-white-card material, not a broken token.
