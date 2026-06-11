# Phase-0 URL & deep-link inventory (legacy app)

Enumerated from the legacy Backbone source (not from a running app — see
[`README.md`](./README.md) for why screenshots are pending). This is the
**URL/compatibility contract** every migrated page must satisfy (MIGRATION.md §3).

## Routes (one Backbone app per page, each its own `Backbone.history`)

| Route | Legacy `history.start` root | App |
|-------|------------------------------|-----|
| `/` | n/a (static home) | `apps/home` — templates/styles only, no interactivity |
| `/brooklyn` | `/brooklyn` | `apps/brooklyn` — property sales 2003–2014 |
| `/311` | `/311` | `apps/311` — NYC 311 calls 2010–2014 |
| `/chicago` | `/chicago/` | `apps/chicago` — Chicago crime 2003–2014 |
| `/north-carolina` | `/north-carolina` | `apps/north-carolina` — districts/gerrymandering |

All four interactive apps run with `pushState: true`.

## Deep-link / querystring states

Every app shares one router (`components/graph-key/router.coffee`) with a single
route `""` whose handler parses the **querystring** (`querystring.parse`) and
branches on these mutually-exclusive params (checked in this order):

| Param | Example | Meaning | Emitted by |
|-------|---------|---------|------------|
| `area` | `?area=official-2012` | Selected map area / neighborhood (NTA) / map-type | map click (`svg-map/mouse.coffee`, `svg-map/base.coffee`), NC map-type links |
| `area` + `hover` | `?area=<id>&hover=<id>` | Selected area **and** hovered area | map hover (`svg-map/mouse.coffee:43`, `north-carolina/client/map.coffee:12`) |
| `type` | `?type=<key>` | Selected dataset/category | `select/index.coffee` dropdown |
| `date` | `?date=<n>` | Selected time value (numeric) | `slider/index.coffee` time slider |
| _(none)_ | `/brooklyn` | Overview / default view | router `overview()` |

`replace: true` is used for hover/select/date/clear navigations (they replace
history rather than push — a recent commit stopped pushing UI events into
browser history).

### Per-app applicability of each control

| App | map `?area`/`&hover` | `?type` (select) | `?date` (slider) |
|-----|:---:|:---:|:---:|
| brooklyn | ✅ | — | ✅ |
| 311 | ✅ | ✅ | ✅ |
| chicago | ✅ | ✅ | — |
| north-carolina | ✅ | (`/type/<key>` links, see below) | — |

### North Carolina specifics (`apps/north-carolina/templates/index.jade`)

Map-type selector links — these exact deep links must keep resolving:

- `/north-carolina?area=official-2012` — Official 2012 districts
- `/north-carolina?area=splitline` — Shortest Splitline
- `/north-carolina?area=brian` — Brian Olsen districts
- `/north-carolina?area=<mapType>&hover=<districtId>` — district hover state

`options.jade` also renders `/north-carolina/type/<key>` anchors (path-style),
though the active router only handles the querystring `""` route — flagged for
verification when NC is ported.

## Notes for migration (re-implement as `?`-search-params)

- Re-implement this router as URL `URLSearchParams` (MIGRATION.md §2.1.3). Keep
  param names (`area`, `hover`, `type`, `date`) identical so externally-linked
  deep links still land on the right view; add a compat shim if any format must
  change.
- The four roots and their querystring states above are the regression target
  for each ported page.
