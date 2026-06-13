/**
 * Shared type declarations for migrated visualizations.
 *
 * The chart data shapes below describe the committed display JSON the legacy
 * D3 charts consumed (see ARCHITECTURE.md "Data model"). Per-page/aggregation
 * shapes (e.g. the brooklyn `Sale` model) are added as pages land in P2.2.
 */

/** Chart margins, matching the legacy `margin` objects. */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A single time-series point. `date` is epoch milliseconds. */
export interface DataPoint {
  date: number;
  value: number;
}

/** A time-series point carrying an inter-quartile band (line-graph trend variant). */
export interface TrendPoint extends DataPoint {
  pct25: number;
  pct75: number;
}

/** One rendered line/series: a name, the points, and an optional display id. */
export interface Series<P extends { date: number } = DataPoint> {
  /** Series key (e.g. neighborhood name, or `…-mean`). */
  name: string;
  /** Optional display id (e.g. dataset name, or `"Borough Average"`). */
  id?: string;
  values: P[];
}

/**
 * The choropleth color input: an id (neighborhood/tract) and its scalar value.
 * Mirrors the `{ id, value }` shape consumed by `svg-map/color.coffee`.
 */
export interface ColorDatum {
  id: string;
  value: number;
}

// ─── NC display-data.json ────────────────────────────────────────────────────
export interface NCCensusTract {
  id: string;
  district: string;
  point: [number, number];
  pop: number;
  white: number;
  black: number;
  asian: number;
  children: number;
  poverty: number;
  veteran: number;
  employed: number;
  unemployed: number;
  armed: number;
  bachelors: number;
  democrat: number;
  republican: number;
  [key: string]: unknown;
}

// ─── Chicago display-data ────────────────────────────────────────────────────
export interface ChicagoNeighborhoodData {
  crimeTally: DataPoint[];
  crimeType: Record<string, DataPoint[]>;
}
export type ChicagoData = Record<
  string,
  ChicagoNeighborhoodData & { 'crimeTally-mean'?: DataPoint[] }
>;

// ─── 311 display-data ────────────────────────────────────────────────────────
export interface ThreeOneOneNeighborhoodData {
  complaintTally: DataPoint[];
  complaintType: Record<string, DataPoint[]>;
}
export type ThreeOneOneData = Record<
  string,
  ThreeOneOneNeighborhoodData & { 'complaintTally-mean'?: DataPoint[] }
>;

// ─── Brooklyn display-data ───────────────────────────────────────────────────
export interface BrooklynNeighborhoodData {
  residentialPrices: DataPoint[];
  buildingClass: Record<string, DataPoint[]>;
}
export type BrooklynData = Record<
  string,
  BrooklynNeighborhoodData & { 'residentialPrices-median'?: DataPoint[] }
>;
