# Offline ETL — raw data → display JSON

The visualization pages load small, pre-aggregated **display JSON** from
`public/data/<app>/`. That display JSON is produced **offline** from large raw
datasets — it is not computed in the browser. This doc covers the migration of
the legacy CoffeeScript ETL (`apps/*/format-data.coffee`,
`apps/*/script/format-display-data.coffee`, `apps/brooklyn/geocode-sales.coffee`)
to typed, tsx-runnable TypeScript under `scripts/etl/` (MIGRATION.md §2.3).

## ⚠️ Raw inputs are not in the repo

Every legacy pipeline consumes a **gitignored raw dataset that is not present in
this working tree** (they were processed locally years ago and never committed):

| App | Raw input (gitignored, absent) | Output (committed) |
|-----|-------------------------------|--------------------|
| brooklyn | `apps/brooklyn/data/brooklyn-sales.json` (geocoded sales GeoJSON) | `public/data/brooklyn/brooklyn-sales-display-data.json` |
| 311 | `apps/311/data/311-by-neighborhood.json` (line-delimited features) | `public/data/311/display-data.json` |
| chicago | `apps/chicago/data/crimes.csv` | `public/data/chicago/chicago-crimes-display-data.json` |
| north-carolina | `apps/north-carolina/data/census-block-by-district.json` + `vote-tally.json` | `public/data/north-carolina/display-data.json` |

Because the raws are absent, the display JSON **cannot be regenerated
byte-for-byte here right now**. The committed display JSON is the **canonical
source of truth** (confirmed with the maintainer). The ported TS reproduces the
legacy logic and will rebuild the outputs once a raw dataset is supplied (drop it
at the path above and run the script). Each build step exits with a clear error
if its raw input is missing.

> **Provenance gap:** sourcing the raw datasets for a one-time real regen +
> byte-diff verification is tracked in
> [GitHub issue #15](https://github.com/zamiang/vislet/issues/15).

The ETL **transform logic is unit-tested** (`__tests__/etl/`) using synthetic
fixtures, and the brooklyn date axis is validated against the committed display
data — so correctness is covered without needing the raws.

## The 12 MB `bbl-to-lat-long.json` — already client-safe

A migration concern was keeping the 12 MB `bbl-to-lat-long.json` out of the
client bundle. Investigation shows it **already never ships to the client**: the
brooklyn client (`apps/brooklyn/client/index.coffee`) loads only the aggregate
display data + `brooklyn.json` (neighborhood topojson). `bbl-to-lat-long.json`
and `block-lot-to-bbl.json` are used **only** in the offline geocoding step
(`geocode-sales.coffee`): raw sales × bbl-hash → per-sale lat/long → GeoJSON,
which is then aggregated. The map is a **choropleth** (neighborhoods colored by
aggregate), not individual points. So there is no client-side lat/long join to
move to build time — the offline geocode step is ported for completeness/repro
only. (Confirm with the page/chart work if a future brooklyn view needs per-sale
points.)

## Layout

```
scripts/etl/
├── build.ts                 # `npm run data:build` — runs every app's build step
├── lib/
│   ├── dates.ts             # quarter/year key → epoch (America/New_York, DST-aware)
│   ├── bbl.ts               # Borough-Block-Lot helpers (port of numberutils/bbl)
│   └── initials.ts          # complaint/crime initials (port of datautil/get-initials)
└── brooklyn/
    ├── aggregate.ts         # typed port of collections/sales.coffee getSalesData
    └── build.ts             # `npm run data:build:brooklyn` — raw GeoJSON → display JSON
```

311 / chicago / north-carolina aggregation modules are ported in follow-ups
(pending the data-source decision — see the hive query on p2.3-etl).

## Running

```bash
npm run data:build            # all apps (errors per step on missing raw input)
npm run data:build:brooklyn   # brooklyn only
npm test -- __tests__/etl     # ETL unit tests
```

### Date handling note

The legacy Moment code generated dates in **America/New_York** local time
(DST-aware). `lib/dates.ts` reproduces this via the `Intl` API rather than a
fixed offset, because DST membership of e.g. April 1 varies by year (pre-2007 US
DST started in April, so Apr 1 2003–2006 was EST while Apr 1 2013 was EDT). This
makes the output match the committed date axis on any build host.
