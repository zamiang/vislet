/**
 * 2020 Neighborhood Tabulation Area (NTA) lookup — assigns a lat/long to its
 * NTA2020 code via point-in-polygon over the DCP boundaries (Socrata 9nt8-h7nd).
 *
 * The boundaries GeoJSON (~4.6 MB) is fetched on demand and cached under the
 * gitignored `scripts/etl/.cache/`. A per-feature bounding-box prefilter keeps
 * the `d3.geoContains` calls cheap; results are memoized per rounded coordinate
 * (311 records geocode to building centroids, so coordinates repeat heavily).
 */
import { geoBounds, geoContains } from 'd3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const NTA_BOUNDARIES_URL =
  'https://data.cityofnewyork.us/api/geospatial/9nt8-h7nd?method=export&format=GeoJSON';

const CACHE_PATH = join(process.cwd(), 'scripts/etl/.cache/nta-2020-boundaries.geojson');

export interface NtaProperties {
  nta2020: string;
  ntaname: string;
  boroname: string;
  borocode: string;
  /** "0" = residential neighborhood; others are parks/airports/cemeteries/etc. */
  ntatype: string;
}

export type NtaFeature = GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, NtaProperties>;
export type NtaCollection = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon | GeoJSON.Polygon,
  NtaProperties
>;

/** Fetch (or read cached) full-resolution 2020 NTA boundaries. */
export async function loadNtaBoundaries(): Promise<NtaCollection> {
  if (existsSync(CACHE_PATH)) {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as NtaCollection;
  }
  const res = await fetch(NTA_BOUNDARIES_URL);
  if (!res.ok) throw new Error(`Failed to fetch NTA boundaries: ${res.status}`);
  const geo = (await res.json()) as NtaCollection;
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(geo));
  return geo;
}

interface IndexedFeature {
  code: string;
  feature: NtaFeature;
  bounds: [[number, number], [number, number]];
}

export class NtaIndex {
  private features: IndexedFeature[];
  private memo = new Map<string, string | null>();

  constructor(collection: NtaCollection) {
    this.features = collection.features.map((feature) => ({
      code: feature.properties.nta2020,
      feature,
      bounds: geoBounds(feature),
    }));
  }

  /** NTA2020 code containing [longitude, latitude], or null if outside NYC. */
  lookup(longitude: number, latitude: number): string | null {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
    // ~1e-5 deg ≈ 1 m — collapses repeated building-centroid coordinates.
    const key = `${longitude.toFixed(5)},${latitude.toFixed(5)}`;
    const cached = this.memo.get(key);
    if (cached !== undefined) return cached;

    let found: string | null = null;
    for (const { code, feature, bounds } of this.features) {
      const [[west, south], [east, north]] = bounds;
      if (longitude < west || longitude > east || latitude < south || latitude > north) continue;
      if (geoContains(feature, [longitude, latitude])) {
        found = code;
        break;
      }
    }
    this.memo.set(key, found);
    return found;
  }
}
