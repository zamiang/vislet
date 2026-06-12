# Product

## Register

brand

## Users

Curious readers and Brennan's engineering/design peers who arrive to explore a
small collection of interactive D3 visualizations about US cities (Brooklyn
property sales, NYC 311, Chicago crime, North Carolina districts). They are
reading and poking at data on their own time, not transacting. Most arrive from
the homepage or a deep link shared by someone else; many are on the sibling site
www.zamiang.com and follow a link here. The page's job is to invite exploration
and leave an impression of craft and substance.

## Product Purpose

Vislet (vislet.com) is a static showcase of hand-built interactive data
visualizations. It is a sibling property to Brennan's personal site
(zamiang-dot-com-v2) and should read as the same author's work. Success looks
like a visitor understanding a city's data through direct manipulation (sliders,
map selection, linked charts) and coming away with the same warm, considered
sense of craft the homepage conveys. The visualizations are the product; the
chrome frames them.

## Brand Personality

**Voice**: Direct, warm, unhurried. Lets the data and the interaction speak
rather than narrating. **Tone**: Editorial and substantive — quiet confidence,
no salesmanship. **Three words**: Thoughtful, Builder, Curious (shared with the
sibling site). Warmth is carried by the copper accent, serif editorial type, and
generous whitespace against a cool slate palette — never by decoration.

## Anti-references

- **Generic SaaS / analytics dashboard.** Card grids, gradient hero-metric
  blocks, navy-and-teal chrome, identical icon cards. The viz pages are tools but
  must not read as a BI product.
- **Trendy AI-slop landing.** Cream/sand body bg, tiny uppercase tracked eyebrows
  above every section, glassmorphism, numbered `01 / 02` section markers.
- **Sterile Material / Bootstrap defaults.** Flat component-library look with no
  editorial voice or typographic character.
- **Over-animated showcase.** Scroll-jacking, parallax, motion that competes with
  the data. Motion serves comprehension (transitions on filter/selection), nothing
  more.

## Design Principles

1. **One author, two sites.** Vislet must look like it was made by whoever made
   zamiang.com. Inherit the Slate Executive palette, the EB Garamond + Lato +
   JetBrains Mono voice, and the editorial restraint. See DESIGN.md.
2. **D3 owns the math, React owns the DOM.** Design decisions render as JSX, never
   imperative D3 DOM mutation. (Mirrors the migration's core engineering rule.)
3. **Data legibility is sacred.** Choropleth/sequential color ramps exist to encode
   data accurately; brand color never overrides a data scale. Brand color lives in
   chrome, selection, and accent — not in the encoding.
4. **Parity is the floor, not the ceiling.** Don't break legacy URLs, deep-link
   states, or data; within those constraints, raise type, spacing, and color to the
   sibling's standard rather than cloning the 2015 look.
5. **Content breathes.** Generous whitespace, constrained reading columns, clear
   sections — the homepage and prose carry the sibling's 600px editorial column.

## Accessibility & Inclusion

WCAG 2.1 AA. Light mode only by design. Respect `prefers-reduced-motion` (collapse
transitions to near-instant). Semantic markup, visible focus indicators, body and
label text held to ≥4.5:1 contrast against their actual background (the Cool Mist
`#f0f2f5` surface, not white). Choropleth ramps must stay distinguishable; pair
color with selection outline/label so encoding never relies on hue alone.
