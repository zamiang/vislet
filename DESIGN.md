# Design

> Vislet inherits the **"Slate Executive"** system from its sibling repo
> `zamiang-dot-com-v2`. That repo's `src/styles/globals.css` is the upstream
> source of truth for shared tokens; this file documents how the system is
> applied to vislet's editorial home + interactive D3 viz pages. When the two
> drift, the sibling wins for chrome/voice; vislet adds only what data
> visualization requires (sequential/choropleth ramps).
>
> Canonical local source: `src/styles/globals.css` (`:root` block).

## Theme

Single light mode. Cool, restrained, reading-first, with one warm copper accent.
The page background is **Cool Mist `#f0f2f5`, never pure white** — this is the
single most visible consistency lever vs. the sibling. Depth comes from hairline
rules, generous whitespace, and (optionally) a faint paper-noise overlay — not
from shadows or gradients.

## Color — "Slate Executive"

| Token                | Hex       | Use                                             |
| -------------------- | --------- | ----------------------------------------------- |
| `--background`       | `#f0f2f5` | Page — Cool Mist, never pure white              |
| `--foreground`       | `#2c333a` | Body / ink — Deep Charcoal Blue                 |
| `--primary`          | `#5a7684` | Steel Blue — chrome, viz selection/handle       |
| `--accent`           | `#749ca8` | Dusty Teal — link borders, labels, accents      |
| `--accent-bold`      | `#c17f59` | Warm Copper — the only warm color; emphasis/CTA |
| `--muted`            | `#e8eaed` | Fills                                           |
| `--muted-foreground` | `#4a5560` | Meta, captions, axis labels (AA on Cool Mist)   |
| `--border`           | `#d1d5db` | Hairline rules, separators                      |
| `--destructive`      | `#b44d4d` | Errors only                                     |
| `--success`          | `#5a8a6b` | Confirmation only                               |

### Data-encoding palettes (vislet-only, never overridden by brand color)

- **Sequential choropleth** (311, Chicago, NC): the 9-step ColorBrewer Reds ramp
  `#fee5d9 → #40000a`. Encodes magnitude; keep for data accuracy.
- **Diverging choropleth** (Brooklyn price/sqft): the 9-step Spectral ramp
  `#3288bd → #d53e4f`. Cheap→expensive.
- **Rule:** brand color lives in chrome, selection outline, slider handle, and
  chart accents — it must never replace a value on a data scale. Pair color with
  a selection outline/label so encoding never relies on hue alone (a11y).

### Consistency status

Done (palette + fonts now match the sibling):

- `--background` → `#f0f2f5`, `--foreground` → `#2c333a`,
  `--muted-foreground` → `#4a5560`, `--accent` → `#749ca8`; added
  `--primary #5a7684`, `--accent-bold #c17f59`, `--muted`, `--border`, motion tokens.
- Nav/label sans switched Libre Franklin → **Lato**; JetBrains Mono loaded.
- Viz `steelblue` literals (`.tract.selected`, `.handle`, `.trend-area`,
  `.circle-key.blue`, faux-underline hover, `lineColor()` stroke) → `--primary`.

Remaining:

- Generic grays (`#333`, `#555`, `#999`, `#f2f2f2`, `color: black`) in the intro/
  author chrome → reconcile to `--foreground` / `--muted-foreground` / `--border`.
- Body `font-size` is still `20px` → move to the sibling's 18px fluid scale.
- Fixed-width map apps (`1054px`) need a responsive strategy for mobile.
- Optional: adopt the sibling's `.bm-noise` paper-grain overlay.

## Typography

- **Serif — EB Garamond** (already in use): every heading, editorial body, post
  titles, blockquotes, map headings. The editorial voice.
- **Sans — Lato 400/700**: nav, meta, labels, buttons, axis/legend chrome.
  **Vislet currently uses Libre Franklin here — switch to Lato** to match the
  sibling. (`--font-heading` / `--font-sans` should resolve to Lato.)
- **Mono — JetBrains Mono** (Consolas/Monaco fallback): technical chrome, telemetry,
  code. Not currently loaded in vislet — add it.
- **Base size:** 18px (`1.125rem`). Vislet's body is currently `20px` — bring to the
  sibling's fluid scale.
- **Fluid scale:** `clamp()`-based `--font-size-sm … --font-size-4xl` (see sibling
  `colors_and_type.css`). Adopt verbatim so type scales without media queries.
- **Line height:** 1.7 body, 1.8 long-form, 1.3 headings.
- **Casing:** Title Case for titles; UPPERCASE + `letter-spacing: 0.15em` for
  section labels/eyebrows used _sparingly_ (vislet's nav/labels already do this);
  sentence case for nav/body. Buttons title case.
- **Measure:** reading column capped at **680px**; `max-width: 65ch` on prose
  paragraphs. Homepage/two-column at 960px.

## Spacing & Layout

- Editorial reading column: **680px** centered (home prose, markdown-text).
- Map apps: the legacy fixed `1054px` / `500px+541px` side-by-side grid is a
  **functional** layout (SVG dimensions); keep its proportions but center within
  the slate page and let the chrome (headings, labels, links) adopt the system.
- Paragraph spacing `1.5em`; section padding generous.
- Mobile: collapse to single column ≤768px; the fixed-width map apps need an
  explicit responsive strategy (scroll-container or scaled SVG) — tracked as a bug.

## Motion

Small, principled set (from the sibling):

- `--transition-fast: 150ms` (color/focus), `--transition-normal: 200ms`
  (hover/state), `--transition-slow: 300ms` (transform).
- `--ease-out: cubic-bezier(0.33, 1, 0.68, 1)` (quart-out) — the only curve.
- No bounce/spring/slide. Hover fades color. Viz transitions (filter, selection,
  slider) animate to aid comprehension, nothing decorative.
- Everything wrapped in `@media (prefers-reduced-motion: reduce)`
  (`transition-duration: 0.01ms !important`).

## Borders, Radii, Shadow, Texture

- **Borders:** hairline 1px `--border`. Section/heading underlines are hairlines.
  No side-stripe accent borders.
- **Radii:** `--radius 4px` default; cards `8px`; pills `9999px` only where earned.
- **Shadows:** effectively none. Depth from hairlines + whitespace + optional noise.
- **Texture:** optional fixed full-viewport SVG fractal-noise overlay at
  `opacity: 0.025` (the sibling's `.bm-noise`). Adopt for visual parity if it reads
  well behind the SVGs; skip if it muddies the data.

## Links & Hover

- Links: color shifts to `--accent`; underline (vislet's faux-underline or a
  60%→100% accent border) strengthens on hover. Replace the `steelblue` hover with
  `--primary` / `--accent`.
- No press states beyond color. No shrink, no shadow.

## Accessibility

WCAG 2.1 AA. Body/label text ≥4.5:1 against **Cool Mist `#f0f2f5`** (re-verify all
grays after the bg change — gray-on-white that passed may fail on the tinted bg).
Visible focus rings. Choropleth encoding paired with outline/label, never hue-only.
Respect `prefers-reduced-motion`.
