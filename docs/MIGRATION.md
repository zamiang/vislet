# Vislet — Modernization & Migration Plan

Goal: move Vislet off its 2015-era Ezel/Backbone/CoffeeScript/Gulp stack onto a
modern, typed, well-supported toolchain — **without rewriting the D3
visualization logic from scratch** and without breaking existing URLs.

Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) first for the current state.

---

## 0. Do this first (hours, not days)

These are independent of the framework choice and reduce risk immediately:

1. **Delete dead weight**: ✅ the ETL scaffold and `.next/` removed. Still to do:
   `pages/` (vestigial) and committed `.DS_Store` files. Add `.DS_Store` to
   `.gitignore` globally.
2. **Run `npm audit`** to see the blast radius of the old dependency tree
   (informational — you'll be replacing it anyway).
3. **Capture a baseline**: screenshot or record each of the 5 pages (home,
   brooklyn, 311, chicago, north-carolina) in their current working state. This
   is your visual regression reference for the migration.
4. **Inventory the URLs** that must keep working (`/`, `/brooklyn`, `/311`,
   `/chicago`, `/north-carolina`, plus any deep-link query/hash states the
   `graph-key` router produces).

---

## 1. Target stack

Locked to match your existing Astro-on-Cloudflare projects
([`zamiang-dot-com-v2`](https://github.com/zamiang/homepage-notion-nextjs),
`kelp-native`) so the toolchain, conventions, and deploy story are identical and
you can copy config across.

| Concern       | From                                 | To                                                                                                                                                           |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | Ezel + Backbone                      | **Astro 6** (static-first; ships zero JS by default) with **React 19 islands** for interactive charts                                                        |
| Language      | CoffeeScript                         | **TypeScript 6**                                                                                                                                             |
| Templates     | Jade/Pug                             | **`.astro` components + JSX**                                                                                                                                |
| Styles        | Stylus + nib                         | **Tailwind CSS v4** (via `@tailwindcss/vite`), matching your other repos                                                                                     |
| Bundler/build | Gulp 3 + Browserify                  | **Vite** (built into Astro)                                                                                                                                  |
| Visualization | D3 v3 global API, in a Backbone view | **D3 v7 modular packages inside React** — D3 owns math (scales/shapes/axes/projections), React owns the DOM (see the [D3 section](#d3-v3--v7-modernization)) |
| Routing       | Backbone.Router + history            | **Astro file-based routing** + URL search params for chart state                                                                                             |
| Data          | JSON bundled into JS                 | **Static JSON in `/public/data`, fetched lazily** per page                                                                                                   |
| Hosting       | `gulp-s3` → S3                       | **Cloudflare Pages** (`wrangler.toml`, `pages_build_output_dir = "dist"`)                                                                                    |
| CI/CD         | none                                 | **GitHub Actions** → Cloudflare Pages on push to `master` (preview deploys on PRs)                                                                           |
| Tooling       | none                                 | **ESLint (flat) + Prettier (import sort) + knip + `astro check` + Vitest** — same set as your other repos                                                    |
| Tests         | none                                 | **Vitest** (unit — esp. data-aggregation logic) + **Playwright** (page smoke)                                                                                |
| Runtime       | `engines: 0.12.x`                    | **Node 24.x** (`.nvmrc`, `engines.node`)                                                                                                                     |

### Why Astro

This is a **content-forward static site**: each page is prose wrapped around a few
interactive D3 widgets. Astro's island model is the ideal fit — pages render as
static HTML/CSS and only the chart components hydrate as JS, which also fixes the
current problem of data being shipped _inside_ the JS bundle. It's also the stack
you already run on Cloudflare, so there's nothing new to learn or operate.

### Conventions to copy from `zamiang-dot-com-v2`

- **Project layout:** `src/{components,layouts,lib,pages,styles,types,hooks}`,
  `public/`, `scripts/`, `__tests__/`, plus `CLAUDE.md` / `PRODUCT.md` / `docs/`.
- **`@` → `/src`** Vite alias (kills the `../../../components/...` relative-require
  pain from the old code).
- **Astro 6 `security.csp`** block + `public/_headers` for CSP / `X-Frame-Options`.
- **`wrangler.toml`** with `pages_build_output_dir = "dist"`, no Workers/Functions
  (purely static).
- Same scripts: `dev`, `build`, `check`, `typecheck`, `lint`, `format`, `knip`, `test`.

---

## 2. Migration strategy: strangler-fig, page by page

Do **not** big-bang rewrite. Stand the new app up beside the old one and migrate
one visualization at a time, keeping the old build deployable until the last page
lands.

### Phase 2.0 — Scaffold the new app

- Fastest path: **clone the structure from `zamiang-dot-com-v2`** (copy
  `astro.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`,
  `vitest.config.ts`, `knip.json`, `wrangler.toml`, `.nvmrc`, the `package.json`
  scripts, and the `src/` skeleton) rather than `npm create astro` from scratch —
  the tooling is already dialed in.
- Stand it up beside the old code (fresh branch, or build into `src/` while the old
  tree stays deployable) and add Tailwind v4 + `@astrojs/react` + a GitHub Actions
  workflow that builds, typechecks, and lints on every PR.
- Port the shared **layout** (header/footer/intro Jade → `src/layouts/*.astro`)
  first — every page uses it.
- Move all `apps/*/data/*.json` into `public/data/<app>/` so it's fetched, not
  bundled. **Special-case the 12 MB `bbl-to-lat-long.json`:** prefer pre-joining
  the lat/long into the brooklyn display data at build time so it never ships to
  the client at all; if it's still needed client-side, fetch it lazily on demand.

### Phase 2.1 — Port shared components to typed React + D3

Migrate `components/` one at a time. Recommended order (simplest → hardest):

1. `datautil`, `numberutils` (pure functions — trivial, add Vitest tests)
2. `select`, `slider` (small controls)
3. `graph-key` / legend + **replace its Backbone router with URL search params**
4. `line-graph` (+ percent, trend, transition variants)
5. `area-chart`
6. `svg-tooltips`
7. `svg-map` (most complex: projection, color, mouse, defs)

**Pattern for each chart:** keep D3 for scales, axes, shape generators, and
projections; let React own element creation and lifecycle (no `d3.select`-driven
DOM mutation fighting React). Type the data shapes explicitly — the existing
`Sale` model comment block and the `salesData` structure give you the schema.

### Phase 2.2 — Port pages, simplest first

1. **home** (templates/styles only — no interactivity) → validate layout + deploy.
2. **north-carolina** → exercises map + bar.
3. **chicago** → map + time controls.
4. **311** → map + comparison.
5. **brooklyn** (last — most complex: models, collections, multiple charts,
   building-class aggregation). The aggregation logic in
   `apps/brooklyn/collections/sales.coffee` should be ported to a typed,
   unit-tested TS module; ideally run it **at build time** (or offline) so the
   client just loads finished display data.

For each page: port → diff against the Phase 0 baseline screenshots → confirm
URLs/deep-links still resolve → mark done.

### Phase 2.3 — Move data prep out of the client

The `format-data.coffee` / `script/*.coffee` files are offline ETL. Rewrite them
as **TypeScript build scripts** (run via `tsx`/Node) or a small `scripts/`
pipeline that emits the `public/data/*.json`. For a hand-run, occasional refresh
you do **not** need a workflow engine — a plain script + a documented command is
enough. (The removed ETL scaffold was an abandoned attempt at this; revisit a
scheduler only if data genuinely needs to refresh on a cadence.)

### Phase 2.4 — Cut over deploy & DNS

- Connect the repo to **Cloudflare Pages** (build command `astro build`, output
  `dist/`), driven by the `wrangler.toml` copied in Phase 2.0. PRs get preview
  deploys automatically; `master` deploys to production.
- Verify every legacy URL serves the new page; add `redirects` in `astro.config.mjs`
  for any path that changes.
- Point the `vislet.com` DNS at Cloudflare Pages. **Decommission the S3 bucket.**
- Once green, retire the Gulp pipeline and the old `apps/`, `components/`, `assets/`.

---

## D3 v3 → v7 modernization

This is the heart of the chart work, and it is **not a version bump** — the code
uses D3 **v3.5.17**, whose global-namespace API was completely reorganized in v4
and has only diverged further through v7. Every chart touches at least one renamed
symbol. Plan to rewrite the rendering layer, not port it line-for-line.

### What's actually used today (from the old code) and its v7 equivalent

| D3 v3 (current)                                                | D3 v7 (target)                             | Module                            |
| -------------------------------------------------------------- | ------------------------------------------ | --------------------------------- |
| `d3.scale.linear()`                                            | `d3.scaleLinear()`                         | `d3-scale`                        |
| `d3.scale.quantile()`                                          | `d3.scaleQuantile()`                       | `d3-scale`                        |
| `d3.scale.category*()`                                         | `d3.scaleOrdinal(d3.schemeCategory10)`     | `d3-scale` / `d3-scale-chromatic` |
| `d3.time.scale()`                                              | `d3.scaleTime()`                           | `d3-scale`                        |
| `d3.time.years()`                                              | `d3.timeYears()` / `d3.utcYears()`         | `d3-time`                         |
| `d3.svg.axis()`                                                | `d3.axisBottom()` / `d3.axisLeft()`        | `d3-axis`                         |
| `d3.svg.line()`                                                | `d3.line()`                                | `d3-shape`                        |
| `d3.svg.area()`                                                | `d3.area()`                                | `d3-shape`                        |
| `d3.layout.stack()`                                            | `d3.stack()` (different data shape)        | `d3-shape`                        |
| `d3.svg.brush()`                                               | `d3.brushX()` (new event API)              | `d3-brush`                        |
| `d3.geo.path()`                                                | `d3.geoPath()`                             | `d3-geo`                          |
| `d3.geo.mercator()`                                            | `d3.geoMercator()`                         | `d3-geo`                          |
| `d3.mouse(el)`                                                 | `d3.pointer(event)`                        | `d3-selection`                    |
| `d3.interpolate`                                               | `d3.interpolate` (now in `d3-interpolate`) | `d3-interpolate`                  |
| `d3.max/min/mean/sum/extent/quantile/bisector/range/ascending` | same names                                 | `d3-array`                        |
| `d3.format`                                                    | `d3.format`                                | `d3-format`                       |

`d3.scale.category` and `d3.layout.stack` and `d3.svg.brush` are the **breaking
behavioral changes** — stack's input/output shape and brush's event model both
changed substantially; budget extra time for `area-chart` (stack) and `slider`
(brush).

### Approach

- **Install the umbrella `d3` v7** for convenience, or (preferred, smaller islands)
  import only the submodules each chart needs (`d3-scale`, `d3-shape`, `d3-axis`,
  `d3-geo`, `d3-array`, `d3-selection`). Add `@types/d3` (or per-module types).
- **Let React own the DOM, D3 own the math.** Use D3 for `scaleLinear`, `line`,
  `area`, `geoPath`, `axisBottom`, `stack`, etc., and render the resulting
  `<path d=…>` / `<g>` / ticks as JSX. Avoid `d3.select(...).append(...)` mutating
  nodes React also manages — that's the classic React+D3 footgun.
- **Transitions:** the old code's `transition.coffee` / `animateNewArea` rely on
  D3 v3 selection transitions. Re-implement with either D3 v7 transitions on a
  React-`ref`'d element, or a React animation lib — keep it simple; these are
  decorative.
- **TopoJSON:** `topojson` client lib also moved on (now `topojson-client`,
  `topojson.feature(...)`); update imports when porting `svg-map`.
- Unit-test the **pure math** (scales/aggregation) with Vitest; the rendering is
  validated against the Phase 0 baseline screenshots.

## 3. URL / compatibility contract

These must not break (they may be linked externally / indexed):

- `/`, `/brooklyn`, `/311`, `/chicago`, `/north-carolina`
- Any deep-link state the current `graph-key/router.coffee` encodes (dataset /
  neighborhood selection). Re-implemented as `?`-search-params in
  `src/lib/url-state.ts`.

### Neighborhood code migration (2010 → 2020 NTAs)

When the brooklyn/311 data was refreshed from live NYC Open Data, neighborhood
geography moved from the **2010** Neighborhood Tabulation Areas (`BK73`-style,
2 letters + 2 digits) to the **2020** NTAs (`BK0102`-style, 2 letters + 4
digits). Old `?area=` / `?hover=` deep links use 2010 codes, so they are
transparently rewritten to their 2020 equivalent on load:

- `parseGraphState()` runs every `area`/`hover` value through
  `resolveAreaCode()` → `NTA_2010_TO_2020` (`src/lib/nta-crosswalk.ts`, generated
  by `npm run data:reference`). The two code vintages don't collide (digit
  count differs), so 2020 codes pass through unchanged.
- e.g. `/311?area=BK60` → `BK0902` (Crown Heights North),
  `/brooklyn?area=BK73` → `BK0102` (Williamsburg).

---

## 4. Effort & sequencing estimate

Rough, solo-dev, part-time:

| Phase | Scope                                                  | Rough effort                 |
| ----- | ------------------------------------------------------ | ---------------------------- |
| 0     | Security + cleanup + baseline                          | 0.5 day                      |
| 2.0   | Scaffold + layout + data move + CI                     | 1–2 days                     |
| 2.1   | Shared components → typed React + **D3 v3→v7 rewrite** | 5–8 days                     |
| 2.2   | 5 pages ported                                         | 4–7 days (brooklyn alone ~2) |
| 2.3   | ETL scripts → TS                                       | 1–2 days                     |
| 2.4   | Deploy cutover                                         | 1 day                        |

The long pole is **2.1 (D3 v3→v7 rewrite) + brooklyn**. Everything else is
mechanical once the chart pattern, the layout, and the copied-over tooling from
`zamiang-dot-com-v2` are established.

---

## 5. Definition of done

- [ ] Dead weight removed (ETL scaffold + `.next/` done; `pages/`, `.DS_Store` still to go).
- [ ] All source is TypeScript; `tsc --noEmit` clean; ESLint/Prettier enforced in CI.
- [ ] All 5 pages render identically to the Phase 0 baseline.
- [ ] Data fetched lazily from `/public` or CDN — not bundled into JS.
- [ ] Data-aggregation logic has Vitest coverage; pages have Playwright smoke tests.
- [ ] CI builds + deploys on push to `master`; no manual `gulp deploy`.
- [ ] Legacy URLs (and deep-link states) still resolve.
- [ ] Old Gulp/Backbone/CoffeeScript tree deleted.
