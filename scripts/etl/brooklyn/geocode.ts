/**
 * Brooklyn sales geocoding — typed port of `apps/brooklyn/geocode-sales.coffee`.
 *
 * Offline step: attaches lat/long to raw sales via the BBL lookups, then emits a
 * GeoJSON FeatureCollection of the sales that resolved to coordinates. This is
 * the input to the aggregation step (`aggregate.ts`).
 *
 * The lookups (`bbl-to-lat-long.json`, `block-lot-to-bbl.json`) are used ONLY
 * here — they never ship to the client (see docs/etl.md). Ported for repro
 * completeness; the raw sales input is gitignored/absent (issue #15).
 */
import { formatBBL } from '../lib/bbl';

/** A raw sale row (NYC rolling-sales export; field names vary by vintage). */
export interface RawSale {
  x?: number;
  y?: number;
  bbl?: string;
  BLOCK?: number | string;
  LOT?: number | string;
  block?: number | string;
  lot?: number | string;
  'BUILDING CLASS CATEGORY'?: string;
  'RESIDENTIAL UNITS'?: number;
  'COMMERCIAL UNITS'?: number;
  'LAND SQUARE FEET'?: string | number;
  'GROSS SQUARE FEET'?: string | number;
  'YEAR BUILT'?: number;
  'SALE PRICE'?: string | number;
  'SALE DATE'?: string | number;
}

/** [lat, long] keyed by 10-char BBL. */
export type BblToLatLong = Record<string, [number | null, number | null]>;
/** BBL keyed by "block-lot". */
export type BlockLotToBbl = Record<string, string>;

export interface SaleFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'Point'; coordinates: [number | null, number | null] };
}

export interface SalesFeatureCollection {
  type: 'FeatureCollection';
  crs: { type: 'name'; properties: { name: string } };
  features: SaleFeature[];
}

export interface GeocodeResult {
  collection: SalesFeatureCollection;
  stats: { total: number; success: number; fail: number; noCoords: number };
}

/** Geocode raw sales and build the cleaned GeoJSON (port of geocode-sales.coffee). */
export function geocodeSales(
  sales: RawSale[],
  bblToLatLong: BblToLatLong,
  blockLotToBbl: BlockLotToBbl,
): GeocodeResult {
  let success = 0;
  let fail = 0;
  let noCoords = 0;
  let total = 0;

  const geocoded = sales.map((sale) => {
    total++;
    if (!sale.x) {
      noCoords++;
      if (sale.BLOCK != null) {
        sale.bbl = blockLotToBbl[`${sale.BLOCK}-${sale.LOT}`];
      } else if (sale.block != null) {
        sale.bbl = blockLotToBbl[`${sale.block}-${sale.lot}`];
      }
      sale.bbl ||= formatBBL(3, sale.BLOCK ?? '', sale.LOT ?? '');
      const coords = bblToLatLong[sale.bbl];
      if (coords) {
        sale.x = coords[0] ?? undefined;
        sale.y = coords[1] ?? undefined;
        success++;
      } else {
        fail++;
      }
    }
    return sale;
  });

  const withCoords = geocoded.filter((s) => Boolean(s.x));

  const collection: SalesFeatureCollection = {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: withCoords.map((sale) => ({
      type: 'Feature',
      properties: {
        buildingClass: String(sale['BUILDING CLASS CATEGORY'] ?? '').trim(),
        bbl: sale.bbl,
        block: sale.BLOCK,
        lot: sale.LOT,
        residential: sale['RESIDENTIAL UNITS'],
        commercial: sale['COMMERCIAL UNITS'],
        landSqFt: sale['LAND SQUARE FEET'],
        grossSqFt: sale['GROSS SQUARE FEET'],
        built: sale['YEAR BUILT'],
        price: sale['SALE PRICE'],
        date: new Date(sale['SALE DATE'] ?? 0).valueOf(),
      },
      geometry: { type: 'Point', coordinates: [sale.y ?? null, sale.x ?? null] },
    })),
  };

  return { collection, stats: { total, success, fail, noCoords } };
}
