# Chart Parity Diagnosis: Legacy vs New

**Date:** 2026-06-12  
**Agent:** Pam (pam-mq9yld5l)  
**Branch:** main (post-PR #26 P2.5 visual fixes)  
**Legacy reference:** `docs/qa/screenshots/legacy/brooklyn-01-overview-load.png` + `brooklyn-02-neighborhood-selected.png` (Oct 27 2020 authoritative capture)  
**New site screenshots:** `docs/qa/screenshots/new/brooklyn-01-overview.png` + `brooklyn-02-selected.png`

> **Scope:** Diagnose first, do not fix. All issues below require greenlight before any code changes.

---

## Brooklyn — Detailed Diagnosis

### Overview State (screenshot 01)

| Element | Legacy | New | Regression? |
|---|---|---|---|
| **Initial selection** | No neighborhood selected; help text overlaid on dimmed charts | `BK60` (Park Slope) pre-selected; charts live from first render | 🔴 YES |
| **Map color palette** | Blue-green Spectral (`#3288bd`…`#d53e4f`) — cool=cheap, warm=pricey | Reds (`#fee5d9`…`#40000a`) — same palette as Chicago crime | 🔴 YES |
| **Map selected state** | Legacy: no selection in overview, ALL neighborhoods carry full Spectral fill | New: BK60 always carries its Spectral fill + thick `#333` stroke | 🔴 YES |
| **Help text** | Centered overlay: *"Click on a neighborhood like 'Williamsburg'…"* visible on the dimmed right panel | Same text rendered but charts are already visible and full-opacity beneath it | 🟠 DEGRADED |
| **Chart visibility (overview)** | Right panel at 10% opacity until `.svg-graphs.active` triggered | Charts fully visible immediately (no opacity transition) | 🔴 YES |
| **Color-scale key label** | "QUARTER 1, 2003 - AVG PRICE PER SQFT" with slider at 2003 | "Avg Price per SQFT" (slider starts at last date, not first) | 🟠 YES |
| **Slider initial position** | Slider dot at far-left (2003) — first quarter | Slider dot at far-right (2014) — last quarter | 🟡 MINOR |
| **Back to overview link** | No link (overview IS the initial state) | n/a (always in selected state) | see below |

### Selected State (screenshot 02)

| Element | Legacy | New | Regression? |
|---|---|---|---|
| **Map when neighborhood selected** | ALL neighborhoods → gray outline only; selected → solid BLUE fill (`#4682b4`) | Choropleth fill retained on all neighborhoods; selected gets thick `stroke: #333 1.5px` only | 🔴 YES |
| **"Back to overview" link** | Appears top-left of map: `BACK TO OVERVIEW` in Franklin Gothic uppercase | **Missing entirely** — no way to deselect and return to help-text state | 🔴 YES |
| **Selected name heading** | `PROSPECT LEFFERTS GARDENS, WINGATE` in large blue Franklin Gothic | Same name, smaller sans-serif, not uppercase | 🟡 MINOR |
| **Line chart: y-axis range** | `~$150–$450/sqft` for Prospect Lefferts Gardens | Values in same ballpark; data appears correct | ✅ OK |
| **Line chart: selected + mean** | Blue line (selected neighborhood) + gray line (borough average) | Same two lines rendered | ✅ OK |
| **Stacked area: Building Class** | `0–100%` stacked, full building-class legend below | Same structure, same legend labels | ✅ OK |
| **Hover/red series** | Hovered neighborhood shows as red comparison line | `hoveredId` wired; red line appears on hover | ✅ OK |

### Root-Cause Hypotheses (Brooklyn)

1. **Initial state always-selected (BK60)** → `useState(DEFAULT_SELECTED_ID)` in `Brooklyn.tsx` starts with `'BK60'` rather than `null`. Legacy Backbone router started at no-selection and only entered selected state after a click or `?area=` URL param.  
   *Fix: set `useState<string | null>(null)` and conditionally render the charts only when `selectedId !== null`.*

2. **Wrong color palette** → `globals.css` `.tract.colorN` uses a single Reds ramp (`#fee5d9`→`#40000a`). Legacy used a blue-green Spectral ramp for price data (cool = cheaper, warm = more expensive) and a separate `.red-map .tract.colorN` for crime data (Chicago). The D3 v3 `MapViewBase` set the palette per-map; the v7 port collapsed to one shared palette.  
   *Fix: add `.blue-green-map .tract.colorN` CSS rule set (Spectral or RdYlGn) and pass a `colorPalette="blue-green"` prop to SvgMap for Brooklyn/311.*

3. **Selected state visual** → Legacy `.svg-map .tract.selected { fill: #4682b4 !important; }` overrode the choropleth fill. Current CSS `.tract.selected { stroke: #333; stroke-width: 1.5px }` only adds a border; it does NOT dim other tracts or change fill. The effect is confusing — it's hard to tell which neighborhood is selected.  
   *Fix: add `fill: steelblue` to `.tract.selected` and add a `.tract.dimmed { opacity: 0.25 }` class applied to non-selected tracts when any tract IS selected.*

4. **Missing "Back to overview"** → Legacy had `<a class="brooklyn-svg back …">Back to overview</a>` that called `router.navigate('')`. The new Brooklyn component has no deselect path (clicking the selected tract again does nothing since `onSelect={(id) => setSelectedId(id ?? DEFAULT_SELECTED_ID)}` falls back to BK60, not null).  
   *Fix: render a "Back to overview" button when `selectedId !== null`, and clicking it sets `selectedId = null`.*

5. **Opacity transition on right panel** → Legacy `.svg-graphs-content { opacity: 0.1 }` / `.svg-graphs.active .svg-graphs-content { opacity: 1 }` created the fade-in on selection. New renders charts at full opacity from the start.  
   *Fix: conditional rendering — render the `svg-graphs-content` div only when `selectedId !== null`, or apply CSS transition classes.*

---

## 311 — Preliminary Diagnosis

*Legacy reference screenshots not yet uploaded. Observations from new site vs. legacy structural analysis.*

| Element | Legacy behavior | New site | Regression? |
|---|---|---|---|
| **Initial selection** | No selection, BK60 as default after load from URL | `DEFAULT_AREA = 'BK60'` selected on mount | 🟡 MINOR (same default) |
| **Map color palette** | Orange-red scale (similar to crime — complaint volume) | Same Reds palette | ✅ LIKELY OK (same semantic) |
| **Right panel dimming** | `.svg-graphs.active` transition | Charts always visible | 🟠 SAME AS BROOKLYN |
| **Filter dropdown** | `FILTER 311 REPORTS:` uppercase label + select | Same, but label lowercase ("Filter 311 reports:") | 🟡 MINOR |
| **Date slider** | Starts at last quarter | Starts at last date | ✅ OK |
| **Line + area charts** | Borough avg comparison, complaint type breakdown | Same structure | ✅ OK |

**No major chart data regressions observed in 311.** The key missing interaction is the initial help-text/dimmed state.

---

## Chicago — Preliminary Diagnosis

| Element | Legacy behavior | New site | Regression? |
|---|---|---|---|
| **Initial state** | Overview: no neighborhood selected, help text visible | `DEFAULT_SELECTED_ID = '68'` (Englewood) always selected | 🔴 YES |
| **Map color palette** | `.red-map .tract.colorN` orange-red scale | Single `tract.colorN` red scale | ✅ SIMILAR (both red, different stops) |
| **Chart initial state** | Crime-tally line + crime-type stacked-area only shown on selection | Always shown (Englewood selected) | 🔴 SAME ISSUE AS BROOKLYN |
| **Crime type breakdown x-axis** | Time-of-day axis (legacy showed "crime by hour") | Shows time-of-day axis as well | ✅ LIKELY OK |
| **Color scale direction** | `reverseColorKey` → higher = darker red = more crime | `reverseColorKey` prop is passed | ✅ OK |
| **Date slider** | Monthly ticker 2003-2014 | Same, functional | ✅ OK |

**Root cause for Chicago:** Same `DEFAULT_SELECTED_ID` anti-pattern as Brooklyn. Chicago also needs `useState<string | null>(null)` and conditional chart rendering.

---

## North Carolina — Preliminary Diagnosis

| Element | Legacy behavior | New site | Regression? |
|---|---|---|---|
| **District selector buttons** | `Official 2012` / `Shortest Splitline` / `Shortest Splitline?` toggle buttons | Same buttons wired as HTML `<button>` elements | ✅ OK |
| **Bar chart (White by District)** | Horizontal stacked bar by district showing political composition | Renders correctly | ✅ OK |
| **District map** | SVG choropleth of NC districts | Districts + census-tract circle overlay | ✅ OK (P2.2 added circles) |
| **Blockquote** | 25px italic pull-quote, left margin 50px | Left-border blockquote style | 🟡 MINOR |

NC has no significant chart regressions. Minor styling gap in blockquote.

---

## Cross-Cutting Issues

### 1. 🔴 CRITICAL — Initial "Overview" State Missing (Brooklyn + Chicago)

**Symptom:** Both Brooklyn and Chicago start with a pre-selected neighborhood instead of the legacy overview state (no selection, dimmed charts with help-text).  
**Root cause:** `useState(DEFAULT_SELECTED_ID)` instead of `useState(null)`.  
**Impact:** Users never see the full choropleth unobstructed; "help text" is meaningless when charts are already visible; the interaction affordance (click to reveal) is lost.  
**Fix scope:** `Brooklyn.tsx` + `Chicago.tsx` — change initial state to `null`, add conditional rendering for the charts panel, and add a "Back to overview" button/link in the selected state.

### 2. 🔴 CRITICAL — Brooklyn Map Color Palette Wrong (Spectral vs Reds)

**Symptom:** Brooklyn neighborhoods render in pink→dark-red (Reds scale). Legacy used blue→green (Spectral scale) where blue = low price per sqft, yellow-green = mid, red = high.  
**Root cause:** `globals.css` `.tract.colorN` uses a single Reds palette for all maps. The D3 v3 `color.coffee` applied the Spectral palette to Brooklyn and a separate `.red-map` modifier for crime data.  
**Fix scope:** Add a second `.spectral-map .tract.colorN` CSS rule set and pass a `className` prop (or dedicated `colorPalette` prop) through `SvgMap`.

### 3. 🔴 CRITICAL — Selected Tract Visual (All Maps)

**Symptom:** When a neighborhood is selected, legacy dimmed all others (gray outline) and filled selected in steelblue. New site adds only a thick black stroke to the selected tract; all others keep full choropleth color.  
**Root cause:** `.tract.selected` CSS only adds stroke, doesn't change fill or dim peers.  
**Fix scope:** CSS + SvgMap — add `fill: steelblue` to `.tract.selected`, add `.tract.dimmed { opacity: 0.25 }` applied to non-selected tracts when any selection is active.

### 4. 🟠 MAJOR — Missing "Back to Overview" Link

**Symptom:** No way to return to the unselected choropleth overview once a neighborhood is clicked.  
**Root cause:** Deselect path in `onSelect` handler falls back to `DEFAULT_SELECTED_ID` rather than `null`.  
**Affects:** Brooklyn, Chicago (311 is slightly different — always shows a neighborhood).

### 5. 🟡 MINOR — Slider Initial Position (Brooklyn)

**Symptom:** Legacy slider starts at 2003 (first quarter, leftmost); new starts at 2014 (last quarter, rightmost).  
**Root cause:** `setSelectedDate(lastDate)` on data load instead of `firstDate`.  
**Impact:** Choropleth shows 2014 prices on initial load instead of 2003; less intuitive to start at the end.

---

## Prioritized Fix List

| Priority | Issue | Files |
|---|---|---|
| P1 | Initial state null (no pre-selected neighborhood), conditional chart panel | `Brooklyn.tsx`, `Chicago.tsx` |
| P1 | "Back to overview" link/button when neighborhood selected | `Brooklyn.tsx`, `Chicago.tsx` |
| P1 | Brooklyn map palette: Spectral (blue-green) instead of Reds | `globals.css`, `SvgMap.tsx` |
| P1 | Selected tract: steelblue fill + dim non-selected to 25% opacity | `globals.css`, `SvgMap.tsx` |
| P2 | Slider initial position: start at first date (2003), not last | `Brooklyn.tsx` |
| P2 | Right-panel opacity transition: fade in on selection | `Brooklyn.tsx`, `Chicago.tsx`, `globals.css` |
| P3 | Filter label uppercase ("FILTER 311 REPORTS:") | `ThreeOneOne.tsx` |
| P3 | NC blockquote pull-quote style (larger text, no left border) | `globals.css` |

---

## Methodology Notes

- Legacy screenshots: Oct 27 2020 authoritative capture (Brooklyn only so far).  
- New site screenshots: captured from `localhost:4326` (built from `main` + P2.5 fixes, commit `5730881`).  
- Legacy rebuild was attempted (Node 10 + Gulp 3 + pinned deps) and succeeded locally; those screenshots confirmed the color/state behavior described above, but are superseded by the uploaded reference for formal ground truth.  
- Chicago/311/NC/home legacy references not yet uploaded — diagnosis is structural (source code + new site screenshots) pending those references.
