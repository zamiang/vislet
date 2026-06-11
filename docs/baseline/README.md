# Phase-0 baseline

The visual + behavioral reference for the legacy (D3 v3 / Backbone / CoffeeScript)
app, used to regression-diff every migrated page (MIGRATION.md §0.4, §2.2).

## Status

| Deliverable | Status |
|-------------|--------|
| URL / deep-link inventory ([`url-inventory.md`](./url-inventory.md)) | ✅ delivered (from source) |
| 5-page screenshots | ⏳ **pending** — see blocker below |

## Why screenshots are not yet captured

Both ways to render the legacy app are currently unavailable:

1. **Live production site is down.** `https://www.vislet.com/` and
   `https://vislet.com/` both return connection failures (HTTP 000) — the S3
   bucket / DNS appears decommissioned, so the live legacy app can't be screenshotted.
2. **Local legacy build is infeasible within the timebox.** The legacy stack is
   Gulp 3 + Browserify + `coffeeify`/`jadeify` with `engines.node: 0.12.x` and a
   2015-era `npm-shrinkwrap.json`. It is highly unlikely to install/build on the
   local Node 24 runtime, and the dispatch explicitly timeboxes this to ~30 min
   and says not to rabbit-hole. (Additionally, on the scaffold branch the legacy
   `package.json`/`npm-shrinkwrap.json`/`node_modules` were replaced/removed; a
   legacy build would have to run from a `master` worktree.)

The URL/deep-link inventory — the non-negotiable deliverable — is complete and
sourced directly from the Backbone routers and app code.

## How to capture the screenshots later

Recommended, in order of likely success:

1. **Restore the live site** (re-point DNS or re-serve the existing built assets)
   and screenshot `/`, `/brooklyn`, `/311`, `/chicago`, `/north-carolina` plus the
   deep-link states in `url-inventory.md` with the gstack `browse` skill.
2. **Build the legacy app from a `master` worktree** on a Node version compatible
   with the 2015 deps (e.g. via `nvm`/Docker with Node ~0.12–6), run `gulp server`,
   and screenshot `localhost`. Reserve real time for this — it is the rabbit hole
   the dispatch warned about.

Pending god's direction (see the `query` sent from this task).
