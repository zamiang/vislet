/**
 * Brooklyn property-sales aggregation — typed port of the legacy
 * `apps/brooklyn/collections/sales.coffee` (`getSalesData`) and the per-sale
 * normalization in `apps/brooklyn/models/sale.coffee`.
 *
 * Pure functions of their inputs (no Backbone, no DOM). The output object is the
 * `brooklyn-sales-display-data.json` consumed by the brooklyn page: per-NTA
 * quarterly residential price means + building-class percentages, plus the
 * special "ALL" (-mean) and "BK73" (williamsburgTrend) series.
 *
 * Reproduces the committed display data's structure and date axis; see
 * docs/etl.md for the raw-input situation.
 */
import { ascending, mean, quantile } from 'd3';

import { deriveSaleDateParts, quarterKeyToEpoch, yearKeyToEpoch } from '../lib/dates';

/** Raw sale properties as read by the legacy `Sale` model (shapefile-truncated names). */
export interface RawSaleProperties {
  /** Building class category string, e.g. "01  ONE FAMILY DWELLINGS". */
  buildingCl?: string;
  /** Residential unit count. */
  residentia?: number;
  /** Commercial unit count. */
  commercial?: number;
  /** Neighborhood tabulation area code, e.g. "BK27". */
  ntacode?: string;
  /** Sale price; may be a "$670,000"-style string or a number. */
  price?: string | number;
  /** Gross square feet; may be a "1,492"-style string or a number. */
  grossSqFt?: string | number;
  /** Sale date as epoch ms. */
  date?: number;
}

/** A sale after normalization (mirrors `Sale` post-`initialize`). */
interface NormalizedSale {
  buildingClass: string;
  residentia: number;
  commercial: number;
  ntacode?: string;
  pricePerSqFt?: number;
  quarter: number;
  year: number;
}

export interface DateValue {
  date: number;
  value: number;
}
export interface TrendPoint {
  date: number;
  pct25: number;
  value: number;
  pct75: number;
}

/** Per-NTA display series. Extra keys ("…-mean", "williamsburgTrend") are conditional. */
export interface NeighborhoodDisplayData {
  residentialPrices: DateValue[];
  buildingClass: Record<string, DateValue[]>;
  'residentialPrices-mean'?: DateValue[];
  williamsburgTrend?: TrendPoint[];
}

export type BrooklynDisplayData = Record<string, NeighborhoodDisplayData>;

const QUARTERS = [1, 2, 3, 4];
const YEARS = Array.from({ length: 2014 - 2003 + 1 }, (_, i) => 2003 + i);
const SALES_DATA_KEYS = ['residentialPrices'] as const;
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

/** Insertion order matches `createQuarterlyHash`: year-major, quarter-minor. */
function quarterKeys(): string[] {
  const keys: string[] = [];
  for (const year of YEARS) for (const quarter of QUARTERS) keys.push(`${quarter}-${year}`);
  return keys;
}

interface NtaAccumulator {
  residentialSaleTally: Record<string, number>;
  residentialPrices: Record<string, number[]>;
  commercialSaleTally: Record<string, number>;
  commercialPrices: Record<string, number[]>;
  buildingClass: Record<string, Record<string, number>>;
}

/** Normalize a raw sale (port of `Sale.initialize` + `setupDate`/`setupPricePerSqFt`). */
export function normalizeSale(raw: RawSaleProperties): NormalizedSale {
  const buildingClass = (raw.buildingCl ?? '').trim();
  const { quarter, year } = deriveSaleDateParts(raw.date ?? 0);

  const sale: NormalizedSale = {
    buildingClass,
    residentia: Number(raw.residentia ?? 0),
    commercial: Number(raw.commercial ?? 0),
    ntacode: raw.ntacode,
    quarter,
    year,
  };

  // setupPricePerSqFt with the legacy exclusion rules.
  if (raw.price && raw.grossSqFt) {
    const price = Number(String(raw.price).replace(/[$,]/g, ''));
    const sqft = Number(String(raw.grossSqFt).replace(/,/g, ''));
    const MIN_SQFT = 300;
    const MAX_SQFT = 10000;
    const MIN_PRICE = 10000;
    if (!(sqft > MAX_SQFT || sqft < MIN_SQFT || price < MIN_PRICE) && price / sqft >= 30) {
      sale.pricePerSqFt = price / sqft;
    }
  }
  return sale;
}

function createQuarterlyHash<T extends number | number[]>(empty: () => T): Record<string, T> {
  const hash: Record<string, T> = {};
  for (const key of quarterKeys()) hash[key] = empty();
  return hash;
}

function createYearlyBuildingClassHash(
  buildingClassKeys: string[],
): Record<string, Record<string, number>> {
  const hash: Record<string, Record<string, number>> = {};
  for (const year of YEARS) {
    hash[String(year)] = {};
    for (const bc of buildingClassKeys) hash[String(year)][bc] = 0;
  }
  return hash;
}

/**
 * Aggregate normalized sales into the brooklyn display-data structure.
 *
 * @param sales      raw sale properties (as the legacy `Sale` model reads them)
 * @param ntaCodes   neighborhood codes incl. "ALL" (from nyc-neighborhood-names.json)
 * @param buildingClassKeys  all building-class keys (from building-class.json)
 */
export function aggregateSales(
  sales: RawSaleProperties[],
  ntaCodes: string[],
  buildingClassKeys: string[],
): BrooklynDisplayData {
  // createNeighborhoodDataHash
  const data: Record<string, NtaAccumulator> = {};
  for (const key of ntaCodes) {
    data[key] = {
      residentialSaleTally: createQuarterlyHash<number>(() => 0),
      residentialPrices: createQuarterlyHash<number[]>(() => []),
      commercialSaleTally: createQuarterlyHash<number>(() => 0),
      commercialPrices: createQuarterlyHash<number[]>(() => []),
      buildingClass: createYearlyBuildingClassHash(buildingClassKeys),
    };
  }

  // tallyCounts
  for (const raw of sales) {
    const sale = normalizeSale(raw);
    const bucket = sale.ntacode ? data[sale.ntacode] : undefined;
    if (!bucket) continue;
    const dateKey = `${sale.quarter}-${sale.year}`;

    if (sale.residentia > 0 && sale.commercial < 1 && sale.residentia < 10) {
      if (bucket.residentialSaleTally[dateKey] !== undefined)
        bucket.residentialSaleTally[dateKey]++;
      if (sale.pricePerSqFt && bucket.residentialPrices[dateKey]) {
        bucket.residentialPrices[dateKey].push(Number(sale.pricePerSqFt));
      }
    } else if (sale.commercial) {
      if (bucket.commercialSaleTally[dateKey] !== undefined) bucket.commercialSaleTally[dateKey]++;
      if (sale.pricePerSqFt && bucket.commercialPrices[dateKey]) {
        bucket.commercialPrices[dateKey].push(Number(sale.pricePerSqFt));
      }
    }

    if (sale.buildingClass.length > 0) {
      const yearBucket = bucket.buildingClass[String(sale.year)];
      const bc = sale.buildingClass.substring(0, 2);
      if (yearBucket && yearBucket[bc] !== undefined) yearBucket[bc]++;
    }
  }

  computeBuildingClassPercent(data, ntaCodes);
  return formatSalesDataForDisplay(data, ntaCodes);
}

/** Convert per-year building-class counts to percentages (port of computeBuildingClassPercent). */
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

/** Collect every value across all NTAs per quarter-key (port of getSalesTotals). */
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
    const flattened: NeighborhoodDisplayData = {
      residentialPrices: [],
      buildingClass: {},
    };

    for (const key of SALES_DATA_KEYS) {
      const series = data[ntaID][key];
      flattened[key] = Object.keys(series).map((itemKey) => {
        const arr = series[itemKey].slice().sort(ascending);
        const m = mean(arr);
        return { date: quarterKeyToEpoch(itemKey), value: m ? Number(m.toFixed(2)) : 0 };
      });

      if (ntaID === 'ALL') {
        const totals = getSalesTotals(data, ntaCodes);
        flattened[`${key}-mean`] = Object.keys(totals).map((totalKey) => ({
          date: quarterKeyToEpoch(totalKey),
          value: Number((mean(totals[totalKey]) ?? 0).toFixed(2)),
        }));
      }

      if (ntaID === 'BK73') {
        flattened.williamsburgTrend = Object.keys(series).map((itemKey) => {
          const arr = series[itemKey].slice().sort(ascending);
          return {
            date: quarterKeyToEpoch(itemKey),
            pct25: Number((quantile(arr, 0.25) ?? 0).toFixed(2)),
            value: Number((mean(arr) ?? 0).toFixed(2)),
            pct75: Number((quantile(arr, 0.75) ?? 0).toFixed(2)),
          };
        });
      }
    }

    flattened.buildingClass = formatBuildingClassData(data[ntaID].buildingClass);
    formatted[ntaID] = flattened;
  }

  return formatted;
}

/** Port of formatBuildingClassData: per valid class, a per-year fractional series. */
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
