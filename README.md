# Vislet

Small interactive visualizations to help us understand the cities we live in —
a static site of D3 data visualizations (Brooklyn property sales, NYC 311 calls,
Chicago crime, North Carolina districts), historically hosted at
[vislet.com](http://www.vislet.com).

## Status

The site is **mid-migration** from a **2015-era stack** (Ezel/Backbone +
CoffeeScript + Jade + Stylus + Gulp + Browserify + **D3 v3**, deployed static to
S3) to a modern one: **Astro + React + TypeScript + D3 v7 + Tailwind v4**, hosted
on **Cloudflare Pages** — matching the setup of
[zamiang.com](https://github.com/zamiang/zamiang-dot-com-v2).

The migration follows a strangler-fig approach: the new Astro app stands beside
the legacy tree, and all pages (`/`, `/brooklyn`, `/311`, `/chicago`,
`/north-carolina`) now render on the new stack. The legacy 2015 toolchain
remains in-tree until it is fully retired.

## Visualizations

| Page              | What it shows                                             |
| ----------------- | --------------------------------------------------------- |
| `/` (home)        | Landing page / project index                              |
| `/brooklyn`       | 322,056 Brooklyn property sales, 2003–2014                |
| `/311`            | 7.7M NYC 311 calls distributed across the city, 2010–2014 |
| `/chicago`        | 5.7M Chicago crimes across the city, 2003–2014            |
| `/north-carolina` | Congressional district / gerrymandering analysis          |

## Development

Node version is pinned in [`.nvmrc`](./.nvmrc) (Node 24). The site is a standard
Astro app:

```sh
npm install
npm run dev        # local dev server (http://localhost:4321)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

Quality gates (CI runs these on every PR):

```sh
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (.ts/.tsx/.astro), zero warnings
npm test           # vitest unit tests
npm run test:e2e   # playwright smoke tests
npm run knip       # unused files/exports/deps
```

Data is fetched at runtime, not bundled. The source datasets are rebuilt from the
ETL scripts under `scripts/etl/` into `public/data/<app>/`:

```sh
npm run data:build              # all apps
npm run data:build:brooklyn     # one app
```

## Design

Vislet shares the **"Slate Executive"** design system with its sibling site
[zamiang-dot-com-v2](https://github.com/zamiang/zamiang-dot-com-v2): a cool slate
palette on a Cool Mist background, EB Garamond (serif) headings over Lato (sans)
body, hairline rules, and a subtle paper-grain texture. The canonical tokens live
in `src/styles/globals.css` (`:root`).

- [`PRODUCT.md`](./PRODUCT.md) — who the site is for, brand personality, design principles.
- [`DESIGN.md`](./DESIGN.md) — the visual system (color, typography, layout, motion).

## Deployment

Hosted on **Cloudflare Pages** via Git integration (config in
[`wrangler.toml`](./wrangler.toml)):

- **Build command:** `npm run build` (`astro build` → `dist/`)
- **Output directory:** `dist`
- **Production branch:** `main` (PRs get automatic preview deploys)

Manual deploys use `npx wrangler pages deploy dist` (not `wrangler deploy`, which
is Workers-mode).

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — orientation for agents: conventions, Git/PR workflow.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the (legacy) site is built.
- [`docs/MIGRATION.md`](./docs/MIGRATION.md) — the phased modernization plan and
  the D3 v3→v7 mapping.

## Legacy workflow (being retired)

The original Gulp/Ezel toolchain still lives in the repo and stays deployable
until the last page lands on the new stack. It is no longer the primary workflow;
prefer the Astro commands above.

```sh
npm install -g gulp
npm install
gulp server      # serve ./dist
gulp watch       # recompile coffee/stylus/jade on change (second tab)
```

Legacy deploys read a gitignored `aws.json` (`{ "key", "secret", "bucket",
"region" }`) and run `gulp deploy` to push hashed/gzipped assets to S3.
