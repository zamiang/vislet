# `public/data/<app>/` — migrated display data

Static display JSON for each visualization, served by Cloudflare Pages and
**fetched lazily** by the page (not bundled into JS, unlike the legacy build).

Copied from the legacy `apps/<app>/data/` during Phase 2.0. The legacy copies
remain in place (strangler-fig) and are removed in the Phase 2.4 cleanup.

## Refreshed from live NYC Open Data

`brooklyn/` and `311/` are no longer copies of the legacy data — they are
regenerated from the NYC Open Data APIs by `scripts/etl/` and refreshed on a
schedule (`.github/workflows/data-refresh.yml`). See `docs/etl.md`.

The legacy 12 MB `apps/brooklyn/data/bbl-to-lat-long.json` geocode table (and
`block-lot-to-bbl.json`) are **retired**: the sales dataset now carries each
lot's 2020 NTA + lat/long natively, so there is no geocode join to ship or
pre-compute.
