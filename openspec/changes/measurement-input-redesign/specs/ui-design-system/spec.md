# Delta for ui-design-system

**Change**: measurement-input-redesign
**Date**: 2026-09-08

---

## ADDED Requirements

### Requirement: Shared Modal/Overlay Primitive

The system SHALL provide a single shared modal/overlay primitive in `src/components/ui/` that all dialog and sheet surfaces build on. The primitive MUST:

- render as a **bottom-sheet at or below the mobile breakpoint** and as a **centered dialog above it**, from one component and one open/close API;
- **trap focus** within the overlay while open, and **restore focus** to the triggering element on close;
- **close on Escape**;
- **close on backdrop (outside) click**;
- **lock body scroll** while open and restore it on close;
- size using **`dvh`-based** units (dynamic viewport height), not `vh`, so the mobile browser chrome does not clip content or a sticky footer;
- when portaled outside its route-group layout, **re-apply the active surface-scope token context** (`.surface-client` or `.surface-coach`) on the portal root, so scoped tokens (`--radius-card`, `--space-card-p`, `--transition-standard`, etc.) resolve identically to an in-tree render.

`AddMeasurementModal` is the first adopter. Migration of the other existing modals is out of scope for this change.

#### Scenario: Renders as a bottom-sheet on mobile

- GIVEN a viewport at or below the mobile breakpoint
- WHEN an overlay built on the primitive opens
- THEN it is anchored to the bottom edge, full-width, with `dvh`-bounded height

#### Scenario: Renders as a centered dialog on desktop

- GIVEN a viewport above the mobile breakpoint
- WHEN the overlay opens
- THEN it renders as a horizontally and vertically centered dialog

#### Scenario: Escape closes and restores focus

- GIVEN the overlay is open and a field inside it has focus
- WHEN the user presses Escape
- THEN the overlay closes and focus returns to the element that opened it

#### Scenario: Backdrop click closes

- GIVEN the overlay is open
- WHEN the user clicks the backdrop outside the overlay content
- THEN the overlay closes

#### Scenario: Focus is trapped while open

- GIVEN the overlay is open
- WHEN the user tabs past the last focusable element
- THEN focus wraps to the first focusable element inside the overlay and never reaches the page behind it

#### Scenario: Body scroll is locked while open

- GIVEN the page behind the overlay is scrollable
- WHEN the overlay opens
- THEN the body cannot scroll; when the overlay closes, the previous scroll position and scrollability are restored

#### Scenario: Portaled overlay preserves surface scope

- GIVEN a client-portal page under `.surface-client`
- WHEN an overlay built on the primitive portals to `document.body`
- THEN the portal root carries `.surface-client` and scoped tokens resolve to their client values
