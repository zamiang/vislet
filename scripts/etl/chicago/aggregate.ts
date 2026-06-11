/**
 * Chicago crime aggregation — typed port of
 * `apps/chicago/script/format-display-data.coffee` (`getCrimesData`).
 *
 * Pure function of its inputs. Produces the `chicago-crimes-display-data.json`
 * shape: per-neighborhood monthly crime rate (per 1,000 residents) + the ALL
 * (-mean) series, plus a per-crime-type hour-of-day rate series.
 */
import { mean } from 'd3';

import { hourEpoch, monthKeyToEpoch } from '../lib/dates';

/** A crime record after the line-level parse in format-data.coffee. */
export interface CrimeRecord {
  crimeType: string;
  nta: string;
  month: number;
  year: number;
  hour: number;
}

export interface DateValue {
  date: number;
  value: number;
}

export interface NeighborhoodCrimeData {
  crimeTally: DateValue[];
  crimeType: Record<string, DateValue[]>;
  'crimeTally-mean'?: DateValue[];
}

export type ChicagoDisplayData = Record<string, NeighborhoodCrimeData>;

/** Population row keyed by neighborhood name. */
type Population = Record<string, { 'TOTAL-2010': number }>;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 2014 - 2003 + 1 }, (_, i) => 2003 + i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CRIMES_DATA_KEYS = ['crimeTally'] as const;
const VALID_CRIME_TYPES = [
  'ASS',
  'NAR',
  'BAT',
  'THE',
  'HOM',
  'ROB',
  'BUR',
  'SEOF',
  'CRDA',
  'OTOF',
  'RIT',
];

interface CrimeAccumulator {
  crimeTally: Record<string, number>;
  crimeType: Record<number, Record<string, number>>;
}

function monthKeys(): string[] {
  const keys: string[] = [];
  for (const year of YEARS) for (const month of MONTHS) keys.push(`${month}-${year}`);
  return keys;
}

function formatDecimal(n: number): number {
  return Number(Number(n).toFixed(2));
}

/**
 * @param crimes      parsed crime records
 * @param crimeTypes  map of crime-name -> code (crime-types.json); we use its codes
 * @param neighborhoodNames  nta-code -> neighborhood name (neighborhood-names.json)
 * @param population  population keyed by neighborhood name
 * @param nowMs       reference date for the (legacy non-deterministic) hour axis
 */
export function aggregateCrimes(
  crimes: CrimeRecord[],
  crimeTypes: Record<string, string>,
  neighborhoodNames: Record<string, string>,
  population: Population,
  nowMs: number,
): ChicagoDisplayData {
  // formatCrimeTypes inverts the map; the legacy code then iterates its keys
  // (the original names) as the per-hour bucket keys.
  const typeKeys = Object.keys(crimeTypes).map((name) => crimeTypes[name]);

  const data: Record<string, CrimeAccumulator> = {};
  for (const key of Object.keys(neighborhoodNames)) {
    const crimeTally: Record<string, number> = {};
    for (const k of monthKeys()) crimeTally[k] = 0;
    const crimeType: Record<number, Record<string, number>> = {};
    for (const hour of HOURS) {
      crimeType[hour] = {};
      for (const t of typeKeys) crimeType[hour][t] = 0;
    }
    data[key] = { crimeTally, crimeType };
  }

  for (const crime of crimes) {
    const bucket = data[crime.nta];
    if (!bucket) continue;
    if (crime.year > 2014 || crime.year < 2003) continue;
    const dateKey = `${crime.month}-${crime.year}`;
    if (bucket.crimeTally[dateKey] !== undefined) bucket.crimeTally[dateKey]++;
    if (crime.crimeType && crime.crimeType.length > 0) {
      const hourBucket = bucket.crimeType[crime.hour];
      if (hourBucket && hourBucket[crime.crimeType] !== undefined) hourBucket[crime.crimeType]++;
    }
  }

  // Faithful to the legacy `_.reduce`: in the ALL branch it summed the input,
  // but `_.reduce` over a *scalar* yields 0. So a scalar input (the regular ALL
  // series and the d3.mean-based -mean series) collapses to 0; only an array
  // input sums. This reproduces the committed all-zero chicago ALL series.
  const averageByPopulation = (value: number | number[], nta: string): number => {
    if (nta === 'ALL') {
      const pops = Object.keys(neighborhoodNames).map((code) => {
        const name = neighborhoodNames[code];
        return population[name]?.['TOTAL-2010'] ?? 0;
      });
      const popTotal = pops.reduce((a, b) => a + b, 0);
      const dataTotal = Array.isArray(value) ? value.reduce((a, b) => a + b, 0) : 0;
      return formatDecimal(dataTotal / (popTotal / 1000));
    }
    const name = neighborhoodNames[nta];
    const pop = population[name]?.['TOTAL-2010'];
    if (!pop) return 0;
    const v = typeof value === 'number' ? value : 0; // non-ALL is always scalar
    if (v < 1 || pop < 1) return 0;
    return formatDecimal(v / (pop / 1000));
  };

  // formatCrimesDataForDisplay
  const formatted: ChicagoDisplayData = {};
  for (const ntaID of Object.keys(data)) {
    const flattened: NeighborhoodCrimeData = { crimeTally: [], crimeType: {} };

    for (const key of CRIMES_DATA_KEYS) {
      const series = data[ntaID][key];
      flattened[key] = Object.keys(series).map((dateKey) => ({
        date: monthKeyToEpoch(dateKey),
        value: averageByPopulation(series[dateKey], ntaID),
      }));

      if (ntaID === 'ALL') {
        // getCrimeTotals collects each NTA's monthly count per key, then the ALL
        // -mean takes d3.mean of those before averaging by population.
        const totals: Record<string, number[]> = {};
        for (const id of Object.keys(data)) {
          const s = data[id][key];
          for (const itemKey of Object.keys(s)) (totals[itemKey] ||= []).push(s[itemKey]);
        }
        flattened[`${key}-mean`] = Object.keys(totals).map((totalKey) => ({
          date: monthKeyToEpoch(totalKey),
          value: averageByPopulation(mean(totals[totalKey]) ?? 0, ntaID),
        }));
      }
    }

    flattened.crimeType = {};
    for (const type of VALID_CRIME_TYPES) {
      flattened.crimeType[type] = HOURS.map((hour) => ({
        date: hourEpoch(hour, nowMs),
        value: averageByPopulation(data[ntaID].crimeType[hour][type], ntaID),
      }));
    }
    formatted[ntaID] = flattened;
  }

  return formatted;
}
