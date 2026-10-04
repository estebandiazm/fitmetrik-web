## Fitmetrik design system — build conventions

No top-level provider is required — these components read no React context.
They DO depend on being rendered against the host page's `body` styling
(dark background, light default text, Manrope font) — this DS ships that as
part of `styles.css`, so as long as the page imports `styles.css` the
default canvas is already correct; don't add your own `background`/`color`
reset on top of it.

**`Table` has no background of its own.** It is always composed inside
`<Card padding="none">` — never render `Table`/`TableHead`/`TableRow`/
`TableCell` directly on the page canvas, they'll look unstyled.

### Styling idiom: Tailwind utilities + a small set of custom `neu-*` classes

Layout, spacing, type, and color are plain Tailwind utility classes against
this DS's own `@theme` tokens (e.g. `text-on-surface`, `text-on-surface-muted`,
`bg-success/10`, `text-error`, `rounded-[var(--radius-control)]`). For
surfaces (cards, buttons, inputs), use the DS's own neumorphic component
classes instead of raw Tailwind — they carry the brand's signature soft-shadow
look and respond to the active surface scope automatically:

| Class | Use for |
|---|---|
| `neu-card` | Any raised surface — what `Card` renders |
| `neu-btn` | A secondary/surface button background |
| `neu-btn-accent` | The primary/accent button background |
| `neu-inset` | A recessed surface (inputs, progress tracks) |
| `neu-surface` | A flat background panel, no elevation |

Radius, shadow, spacing, and transition are CSS custom properties, not
Tailwind scale values — always reference them as `var(...)`, never hardcode
a px/rem shadow or radius: `--radius-card`, `--radius-control`, `--shadow-card`,
`--space-card-p`, `--transition-standard`, `--surface-border`.

### Surface scope changes the theme, not just the color

Two optional wrapper classes — `surface-coach` and `surface-client` — retune
`--radius-card`/`--shadow-card`/`--space-card-p`/`--transition-standard` for
context (coach dashboard: denser/flatter; client portal: spacious/softer).
Wrap a coach-facing composition in `<div className="surface-coach">` or a
client-facing one in `<div className="surface-client">` when the design
calls for that distinction; omit it for the default (dashboard) look.

### Where the truth lives

Read `styles.css` (and its `@import` of `_ds_bundle.css`) before styling
anything outside a known component — it's the full compiled token set. Each
component's own `.prompt.md` documents its real props; the `.d.ts` is the
authoritative type contract.

### Build snippet

```tsx
<div className="surface-coach">
  <Card padding="default">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">👥</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-success bg-success/10">
        ▲ 12%
      </span>
    </div>
    <p className="text-3xl font-bold text-on-surface">24</p>
    <p className="text-sm text-on-surface-muted mt-1">Active Clients</p>
  </Card>
</div>
```
