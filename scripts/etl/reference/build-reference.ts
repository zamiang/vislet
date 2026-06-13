/**
 * One-time-ish reference builder for the 2020-NTA geography migration
 * (tsx-runnable: `npx tsx scripts/etl/reference/build-reference.ts`).
 *
 * Inputs:
 *  - DCP 2020 NTA boundaries (Socrata 9nt8-h7nd, fetched + cached by lib/nta)
 *  - `nta-population-2020.json` — committed extract of DCP's decennial-census
 *    workbook (2010 + 2020 population per NTA2020); see docs/etl.md.
 *  - `nta-2010-topology.json` — frozen copy of the legacy 2010-NTA TopoJSON,
 *    kept only to derive the 2010→2020 deep-link crosswalk.
 *
 * Outputs (committed):
 *  - public/data/311/nyc.json            citywide 2020-NTA TopoJSON (simplified)
 *  - public/data/brooklyn/brooklyn.json  Brooklyn-only 2020-NTA TopoJSON
 *  - public/data/311/nyc-neighborhood-names.json       (residential NTAs + ALL)
 *  - public/data/brooklyn/nyc-neighborhood-names.json  (Brooklyn subset + ALL)
 *  - public/data/311/population.json     { nta2020: [pop2010, pop2020] }
 *  - src/lib/nta-crosswalk.ts            2010 NTA code → 2020 NTA code
 *
 * Re-run only when DCP revises the NTA boundaries.
 */
import { geoBounds, geoContains } from 'd3';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { quantize, feature as topoFeature } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, sphericalTriangleArea } from 'topojson-simplify';

import { type NtaCollection, NtaIndex, loadNtaBoundaries } from '../lib/nta';
import legacyTopology from './nta-2010-topology.json';
import population from './nta-population-2020.json';

const ROOT = process.cwd();

/**
 * Spherical-triangle-area threshold (steradians). ~1e-9 sr ≈ 200 m detail —
 * matches the legacy maps' footprint (~150 KB citywide) at the 500 px map size.
 */
const SIMPLIFY_MIN_AREA = 1e-9;
const QUANTIZATION = 1e4;

type AnyTopo = Parameters<typeof presimplify>[0];

function toTopo(collection: NtaCollection): unknown {
  const geometriesWithIds = {
    ...collection,
    features: collection.features.map((f) => ({ ...f, id: f.properties.nta2020 })),
  };
  let topo = topology({ neighborhoods: geometriesWithIds }) as AnyTopo;
  topo = presimplify(topo, sphericalTriangleArea);
  topo = simplify(topo, SIMPLIFY_MIN_AREA);
  topo = quantize(topo, QUANTIZATION);
  // Strip per-geometry properties — the pages key everything off `id`.
  const neighborhoods = topo.objects.neighborhoods as { geometries: { properties?: unknown }[] };
  for (const g of neighborhoods.geometries) delete g.properties;
  return topo;
}

/**
 * Map each legacy 2010 NTA to the 2020 NTA covering most of it, by sampling a
 * grid of points inside the 2010 polygon and taking the majority 2020 hit.
 */
function buildCrosswalk(index: NtaIndex): Record<string, string> {
  type LegacyTopo = Parameters<typeof topoFeature>[0];
  const legacy = topoFeature(
    legacyTopology as unknown as LegacyTopo,
    (legacyTopology as unknown as { objects: Record<string, never> }).objects.neighborhoods,
  ) as unknown as GeoJSON.FeatureCollection;

  const crosswalk: Record<string, string> = {};
  for (const f of legacy.features) {
    const id = String(f.id);
    const [[west, south], [east, north]] = geoBounds(f as never);
    const votes = new Map<string, number>();
    const STEPS = 24;
    for (let i = 0; i <= STEPS; i++) {
      for (let j = 0; j <= STEPS; j++) {
        const lon = west + ((east - west) * i) / STEPS;
        const lat = south + ((north - south) * j) / STEPS;
        if (!geoContains(f as never, [lon, lat])) continue;
        const hit = index.lookup(lon, lat);
        if (hit) votes.set(hit, (votes.get(hit) ?? 0) + 1);
      }
    }
    const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (winner) crosswalk[id] = winner[0];
  }
  return crosswalk;
}

async function main(): Promise<void> {
  const boundaries = await loadNtaBoundaries();
  // Residential NTAs (ntatype "0") are the ones with sales/311 data; parks,
  // cemeteries, airports, and other non-residential tabulation areas are
  // excluded so every rendered shape on the choropleth is data-bearing and
  // interactive (this replaces the legacy ['99','98'] ignored-id heuristic).
  const residentialCollection: NtaCollection = {
    ...boundaries,
    features: boundaries.features.filter((f) => f.properties.ntatype === '0'),
  };
  const residential = residentialCollection.features;

  const citywide = toTopo(residentialCollection);
  const brooklynOnly = toTopo({
    ...residentialCollection,
    features: residential.filter((f) => f.properties.borocode === '3'),
  });
  writeFileSync(join(ROOT, 'public/data/311/nyc.json'), JSON.stringify(citywide));
  writeFileSync(join(ROOT, 'public/data/brooklyn/brooklyn.json'), JSON.stringify(brooklynOnly));

  // Neighborhood-name lookups (residential only) + the legacy "ALL" pseudo-key.
  const cityNames: Record<string, string> = { ALL: 'ALL' };
  const brooklynNames: Record<string, string> = { ALL: 'ALL' };
  for (const f of residential.sort((a, b) =>
    a.properties.nta2020.localeCompare(b.properties.nta2020),
  )) {
    cityNames[f.properties.nta2020] = f.properties.ntaname;
    if (f.properties.borocode === '3') brooklynNames[f.properties.nta2020] = f.properties.ntaname;
  }
  writeFileSync(
    join(ROOT, 'public/data/311/nyc-neighborhood-names.json'),
    JSON.stringify(cityNames, null, 1),
  );
  writeFileSync(
    join(ROOT, 'public/data/brooklyn/nyc-neighborhood-names.json'),
    JSON.stringify(brooklynNames, null, 1),
  );

  // Population (residential NTAs only): { code: [pop2010, pop2020] }.
  const pop: Record<string, [number, number]> = {};
  for (const f of residential) {
    const entry = (population as unknown as Record<string, [number, number]>)[f.properties.nta2020];
    if (entry) pop[f.properties.nta2020] = entry;
  }
  writeFileSync(join(ROOT, 'public/data/311/population.json'), JSON.stringify(pop, null, 1));

  // 2010 → 2020 deep-link crosswalk (resolve to residential, data-bearing NTAs).
  const crosswalk = buildCrosswalk(new NtaIndex(residentialCollection));
  const ts = `/**
 * Legacy 2010 NTA code → 2020 NTA code, for resolving pre-migration deep links
 * (e.g. /311?area=BK60). GENERATED by scripts/etl/reference/build-reference.ts
 * — do not edit by hand.
 */
export const NTA_2010_TO_2020: Record<string, string> = ${JSON.stringify(crosswalk, null, 2)};
`;
  writeFileSync(join(ROOT, 'src/lib/nta-crosswalk.ts'), ts);

  console.log(
    `Wrote citywide topo (${residential.length} residential NTAs), brooklyn topo, ` +
      `${Object.keys(cityNames).length - 1} names, ${Object.keys(pop).length} populations, ` +
      `${Object.keys(crosswalk).length} crosswalk entries`,
  );
}

await main();
