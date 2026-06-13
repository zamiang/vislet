/**
 * Brooklyn property-sales aggregation over the NYC DOF "Citywide Annualized
 * Calendar Sales" rows (NYC Open Data `w2pb-icbu`).
 *
 * Successor to the legacy `apps/brooklyn/collections/sales.coffee` port: the
 * filtering rules are unchanged (residential building classes, unit-count
 * tests, $/sqft sanity bounds), but sales now arrive from the live API already
 * carrying their 2020 NTA code — no geocoding/BBL join — and the year range is
 * derived from the data instead of the legacy hardcoded 2003–2014.
 *
 * Output is the `brooklyn-sales-display-data.json` shape the brooklyn page
 * consumes: per-NTA quarterly residential price means + per-year
 * building-class percentages, plus the "ALL" borough series.
 */
import { ascending, mean } from 'd3';

import { quarterKeyToEpoch, yearKeyToEpoch } from '../lib/dates';

/** A sales row as returned by the Socrata API (all fields arrive as strings). */
export interface SaleRow {
  /** 2020 NTA code, e.g. "BK0101". Absent for unmapped lots. */
  nta?: string;
  /** ISO date, e.g. "2019-10-17T00:00:00.000". */
  sale_date?: string;
  sale_price?: string;
  gross_square_feet?: string;
  residential_units?: string;
  commercial_units?: string;
  /** e.g. "01 ONE FAMILY DWELLINGS" — first two digits are the class code. */
  building_class_category?: string;
}

interface NormalizedSale {
  buildingClass: string;
  residentialUnits: number;
  commercialUnits: number;
  nta?: string;
  pricePerSqFt?: number;
  quarter: number;
  year: number;
}

export interface DateValue {
  date: number;
  value: number;
}

export interface NeighborhoodDisplayData {
  residentialPrices: DateValue[];
  buildingClass: Record<string, DateValue[]>;
  'residentialPrices-mean'?: DateValue[];
}

export type BrooklynDisplayData = Record<string, NeighborhoodDisplayData>;

const QUARTERS = [1, 2, 3, 4];
// Excludes "16", "17", "23" (very uncommon in Brooklyn), per the legacy comment.
const VALID_RESIDENTIAL_BUILDING_CLASSES = [
  '01',
  '02',
  '03',
  '04',
  '07',
  '08',
  '09',
  '10',
  '12',
  '13',
  '15',
  '28',
];

// Legacy $/sqft sanity bounds (apps/brooklyn/models/sale.coffee): excludes
// nominal-consideration transfers, garage-sized lots, and data-entry outliers.
const MIN_SQFT = 300;
const MAX_SQFT = 10000;
const MIN_PRICE = 10000;
const MIN_PRICE_PER_SQFT = 30;

/** Socrata serves DOF numerics as text, comma-grouped (e.g. "2,160"). */
function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Normalize an API row; returns null for rows without a parseable sale date. */
export function normalizeSale(raw: SaleRow): NormalizedSale | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.sale_date ?? '');
  if (!dateMatch) return null;
  const year = Number(dateMatch[1]);
  const quarter = Math.floor((Number(dateMatch[2]) - 1) / 3) + 1;

  const sale: NormalizedSale = {
    buildingClass: (raw.building_class_category ?? '').trim().slice(0, 2),
    residentialUnits: parseNumber(raw.residential_units),
    commercialUnits: parseNumber(raw.commercial_units),
    nta: raw.nta,
    quarter,
    year,
  };

  const price = parseNumber(raw.sale_price);
  const sqft = parseNumber(raw.gross_square_feet);
  if (
    price >= MIN_PRICE &&
    sqft >= MIN_SQFT &&
    sqft <= MAX_SQFT &&
    price / sqft >= MIN_PRICE_PER_SQFT
  ) {
    sale.pricePerSqFt = price / sqft;
  }
  return sale;
}

interface NtaAccumulator {
  residentialPrices: Record<string, number[]>;
  buildingClass: Record<string, Record<string, number>>;
}

function quarterKeys(years: number[]): string[] {
  const keys: string[] = [];
  for (const year of years) for (const quarter of QUARTERS) keys.push(`${quarter}-${year}`);
  return keys;
}

/**
 * Aggregate API sales rows into the brooklyn display-data structure.
 *
 * @param rows       Socrata `w2pb-icbu` rows (Brooklyn)
 * @param ntaCodes   neighborhood codes incl. "ALL" (nyc-neighborhood-names.json)
 * @param buildingClassKeys  all building-class keys (building-class.json)
 * @param years      contiguous year range of the display axis, e.g. [2016…2025]
 */
export function aggregateSales(
  rows: SaleRow[],
  ntaCodes: string[],
  buildingClassKeys: string[],
  years: number[],
): BrooklynDisplayData {
  const data: Record<string, NtaAccumulator> = {};
  for (const key of ntaCodes) {
    const residentialPrices: Record<string, number[]> = {};
    for (const qk of quarterKeys(years)) residentialPrices[qk] = [];
    const buildingClass: Record<string, Record<string, number>> = {};
    for (const year of years) {
      buildingClass[String(year)] = {};
      for (const bc of buildingClassKeys) buildingClass[String(year)][bc] = 0;
    }
    data[key] = { residentialPrices, buildingClass };
  }

  for (const raw of rows) {
    const sale = normalizeSale(raw);
    if (!sale) continue;
    const bucket = sale.nta ? data[sale.nta] : undefined;
    if (!bucket) continue;
    const dateKey = `${sale.quarter}-${sale.year}`;

    const isResidential =
      sale.residentialUnits > 0 && sale.commercialUnits < 1 && sale.residentialUnits < 10;
    if (isResidential && sale.pricePerSqFt && bucket.residentialPrices[dateKey]) {
      bucket.residentialPrices[dateKey].push(sale.pricePerSqFt);
    }

    if (sale.buildingClass.length > 0) {
      const yearBucket = bucket.buildingClass[String(sale.year)];
      if (yearBucket && yearBucket[sale.buildingClass] !== undefined) {
        yearBucket[sale.buildingClass]++;
      }
    }
  }

  computeBuildingClassPercent(data, ntaCodes);
  return formatSalesDataForDisplay(data, ntaCodes);
}

/** Convert per-year building-class counts to percentages. */
function computeBuildingClassPercent(
  data: Record<string, NtaAccumulator>,
  ntaCodes: string[],
): void {
  for (const key of ntaCodes) {
    for (const date of Object.keys(data[key].buildingClass)) {
      const classes = data[key].buildingClass[date];
      let total = 0;
      for (const bc of Object.keys(classes)) total += classes[bc];
      for (const bc of Object.keys(classes)) {
        if (classes[bc] > 0) {
          const value = Number(((classes[bc] / total) * 100).toFixed(2));
          classes[bc] = value > 1 ? value : 0;
        }
      }
    }
  }
}

/** Collect every value across all NTAs per quarter-key (borough-wide pool). */
function getSalesTotals(
  data: Record<string, NtaAccumulator>,
  ntaCodes: string[],
): Record<string, number[]> {
  const totals: Record<string, number[]> = {};
  for (const ntaID of ntaCodes) {
    const series = data[ntaID].residentialPrices;
    for (const itemKey of Object.keys(series)) {
      (totals[itemKey] ||= []).push(...series[itemKey]);
    }
  }
  return totals;
}

function formatSalesDataForDisplay(
  data: Record<string, NtaAccumulator>,
  ntaCodes: string[],
): BrooklynDisplayData {
  const formatted: BrooklynDisplayData = {};

  for (const ntaID of ntaCodes) {
    const series = data[ntaID].residentialPrices;
    const flattened: NeighborhoodDisplayData = {
      residentialPrices: Object.keys(series).map((itemKey) => {
        const arr = series[itemKey].slice().sort(ascending);
        const m = mean(arr);
        return { date: quarterKeyToEpoch(itemKey), value: m ? Number(m.toFixed(2)) : 0 };
      }),
      buildingClass: formatBuildingClassData(data[ntaID].buildingClass),
    };

    if (ntaID === 'ALL') {
      const totals = getSalesTotals(data, ntaCodes);
      flattened['residentialPrices-mean'] = Object.keys(totals).map((totalKey) => ({
        date: quarterKeyToEpoch(totalKey),
        value: Number((mean(totals[totalKey]) ?? 0).toFixed(2)),
      }));
    }

    formatted[ntaID] = flattened;
  }

  return formatted;
}

/** Per valid class, a per-year fractional series. */
function formatBuildingClassData(
  buildingClass: Record<string, Record<string, number>>,
): Record<string, DateValue[]> {
  const out: Record<string, DateValue[]> = {};
  const dateKeys = Object.keys(buildingClass);
  for (const dataKey of VALID_RESIDENTIAL_BUILDING_CLASSES) {
    out[dataKey] = dateKeys.map((dateKey) => ({
      date: yearKeyToEpoch(dateKey),
      value: Number((buildingClass[dateKey][dataKey] / 100).toFixed(4)),
    }));
  }
  return out;
}
