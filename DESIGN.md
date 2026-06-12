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

Done — palette, fonts, type scale, and layout chrome now match the sibling:

- Palette: `--background #f0f2f5`, `--foreground #2c333a`, `--muted-foreground
#4a5560`, `--accent #749ca8`, `--primary #5a7684`, `--accent-bold #c17f59`,
  plus `--secondary`, `--primary-foreground`, `--accent-foreground`, `--card`,
  `--border`, `--muted`, motion tokens.
- **Reading voice flipped to match the sibling:** body/prose is **Lato (sans)**;
  **EB Garamond (serif)** is reserved for headings + editorial titles (`h1–h6`,
  `.project .title`, `#home .heading`, `.author .name`, `.map-app .heading`,
  `.markdown-text` headings). JetBrains Mono loaded for chrome.
- Fluid `clamp()` type scale (`--font-size-sm … 4xl`) adopted verbatim; body
  base `20px → 18px` (`--font-size`), line-height aligned (1.5 body / 1.7 prose).
- Signature **paper-grain noise overlay** (`body::after`, opacity 0.025) added.
- Dark `.border` bars (`30px × 2px #333`) → **4rem hairline rules** (`1px
--border`), matching the sibling's `.center-divider`.
- Uppercase section labels ("Featured Projects", "Created By") → **teal
  `--accent`** with `--tracking-caps`, echoing `.section-label`.
- Link hover color `--primary → --accent` (teal), matching the sibling.
- Intro/author chrome grays (`#333/#555/#666/#f2f2f2/black`) reconciled to tokens.
- Viz `steelblue` literals → `--primary` (prior pass).

Remaining:

- Fixed-width map apps (`1054px`) still need a responsive strategy for mobile.
- Optional: section-tint full-bleed wrappers.

Intentionally **not** adopted from the sibling: the `FloatingParticles` background
(decorative; would compete with the data visualizations).

## Typography

- **Serif — EB Garamond**: headings and editorial titles only (`h1–h6`, project
  titles, the author name, map headings, blockquote-adjacent headings). The
  editorial voice. Opt in via `--font-serif`.
- **Sans — Lato 400/700**: the default — body/prose, nav, meta, labels, buttons,
  axis/legend chrome. `--font-sans` is the document default; `--font-body` /
  `--font-heading` are aliases that resolve to it.
- **Mono — JetBrains Mono** (Consolas/Monaco fallback): technical chrome, code.
- **Base size:** 18px (`--font-size`), on the fluid `clamp()` scale.
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
