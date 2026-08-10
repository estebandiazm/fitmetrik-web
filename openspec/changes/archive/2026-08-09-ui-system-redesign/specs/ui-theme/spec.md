# Delta for ui-theme

**Change**: ui-system-redesign
**Note**: `ui-theme` is superseded in full by the new `ui-design-system` capability. Both requirements below are removed; their replacements live in `ui-design-system`.

---

## REMOVED Requirements

### Requirement: Modern Blue Aesthetics

(Reason: describes the old pink/purple/magenta glassmorphism brand — including a magenta-to-purple `#E91E8C → #9C27B0` gradient button and MUI Theme Provider dependency — none of which reflect the current dark neumorphic teal/cyan/blue system. MUI is not installed in this project.)
(Migration: see `ui-design-system` spec — "Brand Hue Token Palette" and "Surface Scope Classes" requirements.)

### Requirement: Global Typography

(Reason: content relocated, not removed — folded into the unified `ui-design-system` spec so all visual-system requirements live in one capability. Behavior is unchanged: Manrope remains the primary typeface.)
(Migration: see `ui-design-system` spec — "Typography Token" requirement.)
