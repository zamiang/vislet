# Vislet — Architecture (current state)

> Snapshot of the repo as it stands today, before modernization. See
> [`MIGRATION.md`](./MIGRATION.md) for the plan to move off this stack.

Vislet is a static site of small, interactive data visualizations about US
cities. It is built on the [Ezel](https://github.com/artsy/ezel) convention
(Artsy's Backbone/CoffeeScript boilerplate), compiled with Gulp + Browserify,
and deployed as static HTML/JS/CSS to an S3 bucket (`www.vislet.com`).

## At a glance

| Concern        | Technology |
|----------------|------------|
| Language       | CoffeeScript (client + data scripts) |
| UI framework   | Backbone.View / Backbone.Router + jQuery |
| Visualization  | **D3 v3.5.17** (old global namespace API), TopoJSON |
| Templates      | Jade (now renamed Pug) |
| Styles         | Stylus + nib |
| Bundler        | Browserify (`coffeeify`, `jadeify` transforms) |
| Task runner    | Gulp 3 |
| Utilities      | Underscore, underscore.string, Moment |
| Deploy target  | AWS S3 (static), via `gulp-s3`, gzipped |
| Declared Node  | `0.12.x` (in `package.json` `engines` — wildly out of date; local machine runs Node 24) |

The project is **~42 CoffeeScript**, **~21 Jade**, and **~21 Stylus** files.
There is **no TypeScript, no test suite, no CI, and no lockfile-driven install**
(`npm-shrinkwrap.json` exists but pins very old transitive versions).

## Repository layout

```
vislet/
├── apps/                 # One folder per visualization "page"
│   ├── home/             # Landing page (templates + styles only)
│   ├── brooklyn/         # Property sales 2003–2014 (most complex app)
│   ├── 311/              # NYC 311 calls 2010–2014
│   ├── chicago/          # Chicago crime 2003–2014
│   └── north-carolina/   # Gerrymandering / districts
├── components/           # Shared, reusable view + chart modules
├── assets/               # Browserify entry points (one .coffee + one .styl per app)
├── gulp/                 # Build/deploy task definitions
├── images/               # Static images (run through imagemin)
├── pages/                # Mostly empty (.DS_Store + api/ stub) — vestigial, can be removed
├── gulpfile.js           # Top-level Gulp task wiring
├── package.json          # Deps (all pinned to "*"), Node 0.12 engine
└── npm-shrinkwrap.json   # Frozen old dependency tree (130 KB)
```

> Two abandoned migration/experiment directories — `.next/` (a 2022 Next.js
> build artifact) and `airflow/` (an empty ETL scaffold) — were removed on
> 2026-06-11. They were never tracked in git. **See the Security note below: the
> deleted `airflow/.env` contained live AWS credentials that must still be rotated.**

### `apps/<name>/` anatomy

Each visualization app follows the same convention:

- `client/index.coffee` — entry view; instantiates a `Backbone.View`, wires up
  charts/maps, and starts `Backbone.history` with `pushState`.
- `templates/index.jade` — page markup; `extends` the shared layout and declares
  an `assetPackage` local that maps the page to its compiled JS/CSS bundle.
- `templates/meta.jade`, `templates/text.md` — page metadata and prose copy.
- `stylesheets/index.styl` — page-specific styles.
- `data/*.json` — **pre-computed display data committed to the repo** (see Data below).
- `format-data.coffee` / `script/*.coffee` — offline scripts that transform raw
  source data into the committed `display-data.json` files. These are run by hand,
  not part of the Gulp build.

> **D3 version trap:** the `update to latest d3` commit did *not* take — the
> shrinkwrap and `node_modules` both pin **D3 v3.5.17**. The codebase uses the
> pre-v4 global-namespace API (`d3.scale.linear`, `d3.svg.axis`, `d3.geo.path`,
> `d3.time.scale`, `d3.layout.stack`, `d3.mouse`, `d3.scale.category`). Modern D3
> (v7) renamed essentially all of these, so the charts can't be lifted as-is — see
> the D3 section in [`MIGRATION.md`](./MIGRATION.md).

`brooklyn/` is the richest example and additionally has Backbone `models/` (`Sale`,
`Label`) and `collections/` (`Sales`) that do the aggregation logic
(`getSalesData`, building-class percentages, quarterly tallies).

### `components/` — shared modules

| Component        | Purpose |
|------------------|---------|
| `line-graph/`    | D3 line chart with transitions, trend, percent variants, key |
| `area-chart/`    | Stacked area chart (e.g. building class as % of sales) |
| `svg-map/`       | Choropleth map: `base`, `color`, `mouse`, `defs`, projection |
| `svg-tooltips/`  | Tooltip overlay for maps/charts |
| `slider/`        | Time-range slider control |
| `select/`        | Dropdown control |
| `graph-key/`     | Legend + a `Router` that syncs chart/map state to the URL |
| `layout/`        | Shared header / footer / intro Jade templates + styles |
| `datautil/`, `numberutils/` | Small helpers (name formatting, BBL parsing) |

These are consumed via **relative `require` paths** from app clients
(e.g. `require('../../../components/line-graph/index.coffee')`).

## Build pipeline (Gulp + Browserify)

Defined in `gulpfile.js` and `gulp/*.js`. Key tasks:

- **`scripts`** — globs `assets/*.coffee`, runs each through Browserify with the
  `coffeeify` and `jadeify` transforms, outputs `dist/js/<name>.js`. Each
  `assets/<name>.coffee` is a one-liner that `require(...).init()`s an app client.
- **`styles`** — compiles `assets/*.styl` (Stylus) → minified CSS in `dist/css/`.
- **`templates`** — compiles `apps/*/templates/index.jade` → HTML, remapping
  `home` to the root `index.html`.
- **`images`** — `imagemin` → `dist/img/`.
- **`watch`** — recompiles on `.coffee` / `.styl` / `.jade` changes
  (livereload is disabled — "does not work well :(").
- **`server`** — `gulp-server-livereload` serves `dist/`.

### Deploy (`gulp deploy`)

Reads AWS creds from a local `aws.json` (gitignored) and:

1. Compiles all assets/templates to `dist/`.
2. Hashes assets (`gulp-rev`), moves to `public/`, rewrites references in HTML.
3. Uglifies + gzips.
4. Uploads HTML, scripts, styles, images to the S3 bucket with cache headers.

There is **no environments split, no preview deploys, no rollback** — it's a
direct push to the production bucket.

## Data model

- Visualization data is **large pre-baked JSON committed to git**. Per-app data
  directories total roughly: brooklyn **14 MB**, 311 **3.5 MB**,
  north-carolina **1.8 MB**, chicago **1.2 MB**.
- The largest single committed file is `apps/brooklyn/data/bbl-to-lat-long.json`
  at **12 MB**; several `display-data.json` files are 1–3 MB.
- Raw source datasets (multi-hundred-MB CSVs, raw sales, etc.) are **gitignored**
  (see `.gitignore`) and were processed locally by the `format-data.coffee`
  scripts to produce the committed display data.
- At runtime the client `require`s these JSON files directly into the bundle, so
  **the data ships inside the JS bundle** rather than being fetched lazily.

## Routing & interaction

Each app starts its own `Backbone.history` with a `root` (e.g. `/brooklyn`) and
`pushState: true`. The `graph-key/router.coffee` component maps URL changes to
chart/map dataset selection, so deep-links to a particular neighborhood/metric
work. A recent commit stopped pushing UI events into browser history.

## Known cruft / dead weight

- **`airflow/`** and **`.next/`** — abandoned experiment directories (an empty ETL
  scaffold and a stray 2022 Next.js build artifact). **Removed 2026-06-11.** The
  deleted `airflow/.env` held live AWS credentials — still rotate them (see below).
- **`pages/`** — nearly empty (`.DS_Store` + `api/.DS_Store`); vestigial, safe to remove.
- **`package.json`** pins every dependency to `"*"` and declares Node `0.12.x`.
- **`.DS_Store`** files are committed throughout.

## ⚠ Security findings (address before anything else)

1. **Live AWS keys that were in `airflow/.env`** — the now-deleted file held
   `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in plaintext. `.env` was gitignored
   (so not in git history), and the directory was removed on 2026-06-11 — but
   **deleting the file does not un-expose the keys**. Treat them as compromised and
   **rotate/revoke them in the AWS console** if not already done.
2. **`engines.node: "0.12.x"`** — a Node version from 2015 that is EOL and has
   known CVEs. Nothing actually enforces it (you're on Node 24), but it signals
   the dependency tree is ancient and unaudited.
3. The pinned-`"*"` deps + 2015-era shrinkwrap almost certainly contain many
   packages with published vulnerabilities (`gulp` 3, `browserify`, old `jade`,
   etc.). `npm audit` will be loud.

## Why this is hard to maintain today

- **CoffeeScript + Jade + Stylus + Backbone + Gulp 3 + Browserify** are all
  either deprecated, abandoned, or far out of the mainstream — limited community
  support, hard to hire for, painful to upgrade.
- No types, no tests, no CI → every change is a manual-verify gamble.
- Data is coupled into the JS bundle, inflating bundle size and rebuild time.
- Shared logic is wired with brittle relative `require` paths.
- The two abandoned migration attempts (`.next/`, `airflow/`) show this has been
  a pain point before.
