# Visual Comparison: Legacy vs New Vislet

**Date:** 2026-06-11  
**Agent:** Pam (pam-mq9yld5l)  
**Branch:** qa/visual-comparison  
**Verdict:** ⚠️ **MAJOR REGRESSIONS** — Typography, layout, and styling are significantly degraded on the home page and header. Chart pages render correctly but have layout/font issues.

---

## Methodology

### New site
- Local `npm run build && npm run preview` at `http://localhost:4323`
- Browse headless Chromium, viewport 1440×900
- 6-second post-navigation wait for D3 to render

### Legacy site
- `web.archive.org` is **network-blocked** in this sandbox (TCP timeout to 207.241.237.3). Cannot use Wayback Machine.
- Legacy Jade templates compiled with `jade` CLI + `jstransformer-marked`
- Legacy Stylus compiled to CSS with `stylus` CLI + nib
- CSS inlined into HTML; `wf-active` class simulated (webfont-loaded state)
- **JS was removed** — D3 charts do not render in legacy screenshots (expected; shows layout shell only)
- Screenshots: Browse headless Chromium, file:/// load, viewport 1440×900

This means chart rendering comparison is **one-sided** (new shows live charts, legacy shows layout shell). The structural/typographic/layout comparisons are valid. The chart shape/interaction regression must be inferred from source code diff.

---

## Page-by-Page Comparison

### `/` — Home

| | Legacy | New |
|---|---|---|
| Screenshot | `legacy/home.png` | `new/home.png` |

**Legacy:** Centered, serif (Garamond) typography. Centered `VISLET` heading with decorative underline. `FEATURED PROJECTS` uppercase Franklin Gothic header with thin border line. Project links with faux-underline hover. Author section with circular photo, styled name link, Twitter link.

**New:** Left-aligned, unstyled sans-serif. `VISLET` as plain bold text. Navigation links crammed inline. `FEATURED PROJECTS` plain uppercase text. Project titles as bold links. Plain text footer without author photo.

**Regressions (severity-ranked):**

1. 🔴 **CRITICAL — Typography completely wrong.** Legacy: Adobe Garamond Pro (body) + Franklin Gothic URW (labels/headers) via TypeKit. New: system sans-serif. The entire visual identity relies on these fonts.
2. 🔴 **CRITICAL — Layout not centered.** Legacy: centered column, `max-width: 800px`, `margin: 0 auto`. New: left-aligned, full width.
3. 🟠 **MAJOR — Author section stripped.** Legacy had circular author photo (`gravatar`), styled `Brennan Moore` link, Twitter/Source links in a proper styled block. New has plain text "Created by Brennan Moore / Follow me on Twitter here."
4. 🟠 **MAJOR — VISLET heading style lost.** Legacy: 36px Franklin Gothic centered with `faux-underline-large` decoration (`::before` border-bottom). New: plain text.
5. 🟡 **MODERATE — `FEATURED PROJECTS` section heading.** Legacy had uppercase Franklin Gothic + thin `<hr>` divider line below. New has unstyled heading.
6. 🟡 **MODERATE — North Carolina added to home.** New adds `/north-carolina` as a 4th project (improvement, not regression).
7. 🟢 **MINOR — Spacing.** Legacy had `margin-top: 50px` on `#home`, generous `margin: 40px 0` on project cards. New is compressed.

---

### `/brooklyn` — Brooklyn Property Sales

| | Legacy | New |
|---|---|---|
| Screenshot | `legacy/brooklyn.png` | `new/brooklyn.png` |

**Legacy (shell):** Compact VISLET nav header at top (centered, tiny caps). Centered `Brooklyn Residential Sales 2003-2014` serif heading. Two-column layout: left map SVG container + right `.svg-graphs` panel (541px). Article text below in Garamond.

**New:** Left-aligned plain-text VISLET header. Left-aligned title. D3 charts render (map with neighborhoods, price line graph, building-class stacked area chart). Charts appear in single-column layout, narrower than 1054px legacy width.

**Regressions:**

1. 🔴 **CRITICAL — Typography.** Same font regression as home — body text should be Garamond, labels Franklin Gothic.
2. 🟠 **MAJOR — Layout width.** Legacy `.map-app` was `width: 1054px; margin: 0 auto`. New renders narrower. The side-by-side map+charts layout may have collapsed.
3. 🟠 **MAJOR — Navigation header style.** Legacy had centered tiny-caps Franklin Gothic nav (`BROOKYLN RESIDENTIAL SALES | NYC 311 CALLS | CHICAGO CRIME`). New has different style.
4. 🟡 **MODERATE — Help text visibility.** Legacy showed `.graph-help-text` at `opacity: 0` until `.active` class. New has different interaction model.
5. 🟡 **MODERATE — Date slider.** Legacy had `#brooklyn-date-slider` SVG slider below the map. Needs verification in new.
6. 🟢 **MINOR — Chart rendering.** New does render charts (positive). D3 v7 port appears functional.
7. 🟢 **MINOR — Legend/key.** Legacy had `.brooklyn-svg-key.graph-key-container.visible`. Verify key is showing in new.

---

### `/311` — NYC 311 Calls

| | Legacy | New |
|---|---|---|
| Screenshot | `legacy/311.png` | `new/311.png` |

**Legacy (shell):** Same VISLET nav header. Centered `311 Calls in NYC from 2010-2014` heading. Filter dropdown (`FILTER 311 REPORTS:`). Large map area (empty shell). Long article explaining the data below.

**New:** Similar structure with charts rendering. Map with neighborhoods. Charts panel visible. Header/footer same issues as other pages.

**Regressions:**

1. 🔴 **CRITICAL — Typography.** Font regression.
2. 🟠 **MAJOR — Layout/width.** Same 1054px vs narrower issue.
3. 🟡 **MODERATE — Filter dropdown style.** Legacy had `FILTER 311 REPORTS:` label + styled `<select>`. Verify new has equivalent.
4. 🟡 **MODERATE — Navigation header.** Same nav style regression.
5. 🟢 **MINOR — D3 map/charts render in new** (positive).

---

### `/chicago` — Chicago Crime

| | Legacy | New |
|---|---|---|
| Screenshot | `legacy/chicago.png` | `new/chicago.png` |

**Legacy (shell):** Same VISLET nav. Centered `Chicago Crime 2003-2014` heading. Filter dropdown. Two-column: left map SVG + right charts panel. Chart legend shows `SELECTED NEIGHBORHOOD` and `CITY AVERAGE` with colored dot indicators (`.circle-key`). Article text + author section below.

**New:** Map renders with orange/red choropleth. Crime type breakdown chart renders. Shows `Englewood` detail view. Layout appears narrow.

**Regressions:**

1. 🔴 **CRITICAL — Typography.** Font regression.
2. 🟠 **MAJOR — Layout.** Same width issue; in new screenshot the map and charts appear stacked rather than side-by-side.
3. 🟠 **MAJOR — Initial state.** Legacy showed overview with all neighborhoods visible (`.svg-graphs` starts inactive, showing help text). New screenshot shows `Englewood` already selected — may indicate state initialization bug or Playwright captured mid-interaction.
4. 🟡 **MODERATE — Chart legend.** Legacy used `.circle-key` colored dots + Franklin Gothic uppercase headers. Verify this style in new.
5. 🟡 **MODERATE — Crime type breakdown chart.** Legacy had a time-of-day breakdown; new shows it but needs comparison of color scheme.

---

### `/north-carolina` — Gerrymandering

| | Legacy | New |
|---|---|---|
| Screenshot | `legacy/north-carolina.png` | `new/north-carolina.png` |

**Legacy (shell):** Same VISLET nav. `Gerrymandering in North Carolina` heading. Subtitle. District selector buttons (`Official 2012`, `Shortest Splitline`, `Shortest Splitline?`). `POLITICAL GROUPS BY THE NUMBERS` header. Chart area (empty). Long article text with blockquote pull-quote. Author section.

**New:** VISLET header. `WHITE BY DISTRICT` bar chart renders with red/blue color coding. NC district circles on map visible. Text content rendered. Charts appear to render correctly.

**Regressions:**

1. 🔴 **CRITICAL — Typography.** Font regression.
2. 🟠 **MAJOR — District selector buttons.** Legacy had `Official 2012`, `Shortest Splitline`, `Shortest Splitline?` toggle buttons. New screenshot does not show equivalent buttons — needs verification.
3. 🟡 **MODERATE — Chart header style.** Legacy had Franklin Gothic uppercase section headers. New has plain text.
4. 🟡 **MODERATE — Blockquote styling.** Legacy had 25px italic pull-quotes with `margin-left: 50px`. Verify in new.
5. 🟢 **MINOR — NC circles overlay renders** (positive — P2.2 feature).
6. 🟢 **MINOR — Bar chart renders** (positive — D3 v7 port working).

---

## Cross-Cutting Issues

### 1. 🔴 CRITICAL — TypeKit Fonts Missing (all pages)

The legacy CSS uses:
```stylus
garamond()    // "adobe-garamond-pro", Georgia, Cambria, ...
franklin-gothic()  // "franklin-gothic-urw", sans-serif
```

These were loaded via TypeKit (now Adobe Fonts). The new Astro site has no font loading setup. All body text falls back to system serif/sans. The visual character of vislet.com was defined by these fonts. Without them the site looks like an unstyled browser default.

**Fix:** Add Adobe Fonts embed code to `src/layouts/Layout.astro` or switch to equivalent Google Fonts / variable fonts.

### 2. 🔴 CRITICAL — Home Page Layout Broken (CSS not applied)

The home page's `VISLET` heading is left-aligned in new vs centered in legacy. This suggests the Tailwind/CSS for the home page layout is missing or broken. The legacy `#home` rule had:
```css
margin-top: 50px; max-width: 800px; margin-left: auto; margin-right: auto;
```
The new home template appears to be rendering unstyled.

### 3. 🟠 MAJOR — App Page Width / Side-by-Side Layout

Legacy app pages used `.map-app { width: 1054px; margin: 0 auto }` with map (500px) and charts (541px) side-by-side. New pages appear to be using a narrower layout with possible stacking. The 1054px constraint was intentional for the D3 projections which were sized to fit.

### 4. 🟠 MAJOR — Navigation Header Style

Legacy had a compact centered header:
```
VISLET
Small interactive visualizations...
BROOKYLN RESIDENTIAL SALES  NYC 311 CALLS  CHICAGO CRIME
```
New has a different left-aligned style. The nav link text also differs — legacy has "Brookyln Residential Sales" (with the typo), new corrects it to "Brooklyn Residential Sales" but the style loss outweighs the fix.

### 5. 🟡 MODERATE — Author Section / Footer

Legacy had a styled bio block with circular photo. New has plain text. The author section was below the article text on every page.

---

## Prioritized Fix List

| Priority | Issue | Affected Pages |
|---|---|---|
| P0 | Add web fonts (Adobe Garamond Pro + Franklin Gothic, or equivalents) | All |
| P0 | Fix home page centering and layout CSS | `/` |
| P1 | Verify app page 1054px width and side-by-side map+charts layout | `/brooklyn`, `/311`, `/chicago`, `/north-carolina` |
| P1 | Restore author bio section with photo | All |
| P2 | Navigation header typography (Franklin Gothic caps, centered) | All |
| P2 | FEATURED PROJECTS heading style + border divider | `/` |
| P2 | Project card faux-underline hover style | `/` |
| P2 | District selector buttons on NC page | `/north-carolina` |
| P3 | Chicago initial state (should start on overview, not Englewood) | `/chicago` |
| P3 | Date slider visibility on Brooklyn | `/brooklyn` |
| P3 | Chart legend dot style (`.circle-key`) | `/brooklyn`, `/chicago` |

---

## Methodology Caveats

- **Legacy JS stripped**: D3 charts don't appear in legacy screenshots. Legacy chart shape/color regressions require live legacy build to verify — not done here.
- **TypeKit fonts not loaded in legacy screenshots**: Used Georgia/system-serif fallback. Real legacy would have shown Adobe Garamond Pro. Actual font gap is worse than screenshots suggest.
- **web.archive.org network-blocked**: Wayback snapshots inaccessible from sandbox. Legacy screenshots reconstructed from compiled source.
- **New site via local build**: `npm run preview` of freshly-built dist. Identical to what ships to Cloudflare Pages.
