/**
 * NYC 311 aggregation — typed port of
 * `apps/311/script/format-display-data.coffee` (`getData`).
 *
 * Pure function of its inputs. Produces the 311 `display-data.json` shape:
 * per-neighborhood monthly complaint rate (per 1,000 residents) + the ALL
 * (-mean) series (which sums across neighborhoods), plus a per-complaint-type
 * hour-of-day rate series.
 *
 * Differs from chicago in the population lookup: 311 keys population by NTA code
 * directly and reads index [1]; its ALL -mean sums an array (so it is non-zero),
 * whereas chicago's collapses to zero — both faithful to the legacy code.
 */
import { hourEpoch, monthKeyToEpoch } from '../lib/dates';

export interface ComplaintRecord {
  complaintType: string;
  nta: string;
  month: number;
  year: number;
  hour: number;
}

export interface DateValue {
  date: number;
  value: number;
}

export interface NeighborhoodComplaintData {
  complaintTally: DateValue[];
  complaintType: Record<string, DateValue[]>;
  'complaintTally-mean'?: DateValue[];
}

export type ThreeOneOneDisplayData = Record<string, NeighborhoodComplaintData>;

/** Population keyed by NTA code; value is a tuple where index 1 is the count. */
type Population = Record<string, [unknown, number]>;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 2014 - 2010 + 1 }, (_, i) => 2010 + i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const COMPLAINTS_DATA_KEYS = ['complaintTally'] as const;
const VALID_COMPLAINT_TYPES = [
  'illpar',
  'watsys',
  'blodri',
  'derveh',
  'sewe',
  'strligcon',
  'trasigcon',
  'deatre',
  'sancon',
  'heat',
  'dircon',
  'miscol',
  'buil',
  'concom',
  'rode',
  'nois',
  'bromunmet',
  'taxcom',
];

interface ComplaintAccumulator {
  complaintTally: Record<string, number>;
  complaintType: Record<number, Record<string, number>>;
}

function monthKeys(): string[] {
  const keys: string[] = [];
  for (const year of YEARS) for (const month of MONTHS) keys.push(`${month}-${year}`);
  return keys;
}

const formatDecimal = (n: number): number => Number(Number(n).toFixed(2));

/**
 * @param complaints  parsed complaint records
 * @param complaintTypes  map of complaint-name -> code (complaint-types.json)
 * @param neighborhoodNames  NTA-code -> name (used only for the key set)
 * @param population  population keyed by NTA code (index 1 = count)
 * @param nowMs       reference date for the (legacy non-deterministic) hour axis
 */
export function aggregateComplaints(
  complaints: ComplaintRecord[],
  complaintTypes: Record<string, string>,
  neighborhoodNames: Record<string, string>,
  population: Population,
  nowMs: number,
): ThreeOneOneDisplayData {
  const typeKeys = Object.keys(complaintTypes).map((name) => complaintTypes[name]);
  const ntaCodes = Object.keys(neighborhoodNames);

  const data: Record<string, ComplaintAccumulator> = {};
  for (const key of ntaCodes) {
    const complaintTally: Record<string, number> = {};
    for (const k of monthKeys()) complaintTally[k] = 0;
    const complaintType: Record<number, Record<string, number>> = {};
    for (const hour of HOURS) {
      complaintType[hour] = {};
      for (const t of typeKeys) complaintType[hour][t] = 0;
    }
    data[key] = { complaintTally, complaintType };
  }

  for (const c of complaints) {
    const bucket = data[c.nta];
    if (!bucket) continue;
    if (c.year > 2014) continue;
    const dateKey = `${c.month}-${c.year}`;
    if (bucket.complaintTally[dateKey] !== undefined) bucket.complaintTally[dateKey]++;
    if (c.complaintType && c.complaintType.length > 0) {
      const hourBucket = bucket.complaintType[c.hour];
      if (hourBucket && hourBucket[c.complaintType] !== undefined) hourBucket[c.complaintType]++;
    }
  }

  const averageByPopulation = (value: number | number[], nta: string): number => {
    if (nta === 'ALL') {
      const popTotal = ntaCodes.reduce((sum, name) => sum + (population[name]?.[1] ?? 0), 0);
      const dataTotal = Array.isArray(value) ? value.reduce((a, b) => a + b, 0) : 0;
      return formatDecimal(dataTotal / (popTotal / 1000));
    }
    const pop = population[nta]?.[1] ?? 0;
    const v = typeof value === 'number' ? value : 0;
    if (v < 1 || pop < 1) return 0;
    return formatDecimal(v / (pop / 1000));
  };

  const formatted: ThreeOneOneDisplayData = {};
  for (const ntaID of ntaCodes) {
    const flattened: NeighborhoodComplaintData = { complaintTally: [], complaintType: {} };

    for (const key of COMPLAINTS_DATA_KEYS) {
      const series = data[ntaID][key];
      flattened[key] = Object.keys(series).map((dateKey) => ({
        date: monthKeyToEpoch(dateKey),
        value: averageByPopulation(series[dateKey], ntaID),
      }));

      if (ntaID === 'ALL') {
        // getComplaintTotals pushes each NTA's monthly count into an array per
        // month-key; the ALL -mean sums that array (=> non-zero, unlike chicago).
        const totals: Record<string, number[]> = {};
        for (const id of ntaCodes) {
          const s = data[id][key];
          for (const itemKey of Object.keys(s)) (totals[itemKey] ||= []).push(s[itemKey]);
        }
        flattened[`${key}-mean`] = Object.keys(totals).map((totalKey) => ({
          date: monthKeyToEpoch(totalKey),
          value: averageByPopulation(totals[totalKey], ntaID),
        }));
      }
    }

    flattened.complaintType = {};
    for (const type of VALID_COMPLAINT_TYPES) {
      flattened.complaintType[type] = HOURS.map((hour) => ({
        date: hourEpoch(hour, nowMs),
        value: averageByPopulation(data[ntaID].complaintType[hour][type], ntaID),
      }));
    }
    formatted[ntaID] = flattened;
  }

  return formatted;
}
