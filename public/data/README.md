# `public/data/<app>/` — migrated display data

Static display JSON for each visualization, served by Cloudflare Pages and
**fetched lazily** by the page (not bundled into JS, unlike the legacy build).

Copied from the legacy `apps/<app>/data/` during Phase 2.0. The legacy copies
remain in place (strangler-fig) and are removed in the Phase 2.4 cleanup.

## Intentionally NOT here

`apps/brooklyn/data/bbl-to-lat-long.json` (12 MB) is **excluded** — it must not
ship to the client. Phase 2.3 (data agent) pre-joins its lat/long into the
brooklyn display data at build time so the finished data is all the client loads.
