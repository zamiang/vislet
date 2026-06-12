# CLAUDE.md — Vislet

> Orientation for AI agents working in this repo. Read this first, then the two
> docs it points to. Keep it accurate — if you change conventions, update this file.

## What this is
Vislet is a static site of small interactive D3 data visualizations about US cities
(Brooklyn property sales, NYC 311, Chicago crime, North Carolina districts),
historically at vislet.com.

**We are mid-migration.** The repo currently runs a **2015-era stack** and is being
moved to a **modern one**. Do not add new features to the old stack — only migrate.

| | Current (legacy) | Target |
|---|---|---|
| Framework | Ezel + Backbone | **Astro 6** + **React 19** islands |
| Language | CoffeeScript | **TypeScript** |
| Templates | Jade/Pug | `.astro` + JSX |
| Styles | Stylus + nib | **Tailwind v4** |
| Build | Gulp 3 + Browserify | **Vite** (via Astro) |
| Viz | **D3 v3.5.17** (old global API) | **D3 v7** (modular) |
| Hosting | AWS S3 (`gulp-s3`) | **Cloudflare Pages** |
| CI | none | **GitHub Actions** |
| Tests | none | **Vitest** + **Playwright** |

## The plan — READ BEFORE CODING
- **`docs/MIGRATION.md`** — the authoritative phased migration plan (stack, page-by-page
  strategy, the full **D3 v3→v7 symbol mapping**, effort estimate, definition of done).
  Follow its sequencing; do not improvise a different approach.
- **`docs/ARCHITECTURE.md`** — how the current/legacy site is built (repo layout,
  `apps/<name>/` anatomy, data model).

## Non-negotiable conventions
1. **Strangler-fig, not big-bang.** Stand the new Astro app up beside the old tree;
   keep the old build deployable until the last page lands. Migrate one page/component
   at a time.
2. **D3 owns the math, React owns the DOM.** Use D3 for scales/shapes/axes/projections
   and render the results as JSX (`<path d=…>`, `<g>`, ticks). Never let
   `d3.select(...).append(...)` mutate nodes React also manages — that's the classic footgun.
3. **Don't break URLs.** `/`, `/brooklyn`, `/311`, `/chicago`, `/north-carolina` and the
   deep-link/query states the old `graph-key` router produced must keep resolving. See
   MIGRATION.md §3 (URL/compatibility contract).
4. **Data is fetched, not bundled.** Move `apps/*/data/*.json` to `public/data/<app>/`
   and fetch lazily. Special-case the 12 MB `bbl-to-lat-long.json` (pre-join at build time).
5. **Everything typed + tested.** New code is TypeScript; `tsc --noEmit` must stay clean.
   Unit-test pure math (scales/aggregation) with Vitest; pages get Playwright smoke tests.
6. **Match the sibling repos.** Clone tooling/config conventions from `zamiang-dot-com-v2`
   (Astro config, tsconfig, eslint flat config, prettier, vitest, knip, wrangler) rather
   than scaffolding from scratch. Use the `@` → `/src` Vite alias.

## Git & PR workflow — never commit to `main`
`main` is protected by a **GitHub ruleset** (not classic branch protection, so it won't
show under branch-protection settings — check `gh api repos/zamiang/vislet/rules/branches/main`).
The ruleset enforces:
- **PRs only.** Direct pushes to `main` are rejected — even a "quick" commit. Always branch
  first (`git switch -c <topic>`), push the branch, and open a PR with `gh pr create`. Never
  `git commit` while on `main`. If you find yourself ahead of `origin/main`, you committed to
  the wrong place: move the commit to a branch and `git reset --hard origin/main`.
- **Signed commits required.** Every commit that lands must be signed, or the merge is
  **BLOCKED** regardless of merge method. Ensure signing is on (`git config commit.gpgsign true`
  with an SSH/GPG signing key). An unsigned commit already on a branch must be re-signed
  (e.g. `git rebase <base> -S`) before the PR can merge — CI passing is not enough.
- **Squash-merge** to match repo history (every prior PR landed as `… (#NN)`); the squash
  commit is signed by GitHub, satisfying the rule. Use `gh pr merge <n> --squash --delete-branch`.

Before merging, confirm the PR is actually green AND mergeable: `gh pr view <n> --json
mergeable,mergeStateStatus,statusCheckRollup`. `BLOCKED`/`DIRTY` ≠ ready. Don't open a PR
for content already on `main` — fetch first and diff (`git diff <yourcommit> origin/main`)
to avoid duplicates.

## Security ⚠️
A deleted `airflow/.env` previously held **live AWS keys**. Deleting the file did not
un-expose them — they must be rotated in the AWS console (tracked by the hive). **Never
commit secrets**; never re-add the leaked keys. Verify the rotated deploy key is scoped
to the deploy bucket only.

## Verifying a migrated page
Diff the new page against the **Phase-0 baseline screenshots** of the legacy site;
confirm the page renders identically and every legacy URL + deep-link state still
resolves. Then mark the task done.

## How work is coordinated (the hive)
This repo is migrated by a hive of agents orchestrated from `~/munder-difflin/hive`.
- The shared plan: `~/munder-difflin/hive/board.md` (narrative) + `tasks.json` (kanban).
- You receive work in your `~/munder-difflin/hive/agents/<you>/inbox/`; report progress by
  keeping your task's status current and messaging `god` via your `outbox/`.
- Anything ambiguous, cross-cutting, or needing sign-off → message `god`. Don't big-bang.

## Legacy dev workflow (current stack — being retired)
Old flow is Gulp/Ezel (`make s`, `gulp`). It will be replaced by the standard Astro
`npm run dev` / `npm run build` flow as the migration lands. Node engine is pinned at
`0.12.x` in the legacy `package.json` (ignore it; local runs Node 24 — see `.nvmrc`).
