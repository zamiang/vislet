/**
 * NYC 311 aggregation over the NYC Open Data Service Request datasets
 * (`76ig-c548` 2010–2019 + `erm2-nwe9` 2020–present).
 *
 * Successor to the legacy `apps/311/script/format-display-data.coffee` port.
 * Two differences from the 2015 build:
 *  - records are spatially joined to **2020** NTAs (point-in-polygon on the
 *    record's lat/long) instead of a pre-baked 2010 ntacode column, and
 *  - the monthly axis spans 2010 → the latest month present, instead of the
 *    hardcoded 2010–2014.
 *
 * Because the combined source is ~44 M rows, aggregation is **streaming**: the
 * `ComplaintAccumulator` ingests one record at a time and holds only compact
 * counts (per-NTA monthly totals + per-NTA/type hour-of-day histograms). The
 * accumulator serializes to `311-aggregates.json` (the committed cache) so the
 * monthly CI refresh only has to fold in new rows, never re-pull history.
 *
 * The display JSON it finalizes is unchanged in shape: per-NTA monthly complaint
 * rate (per 1,000 residents) + the ALL (-mean) series, and a per-type
 * hour-of-day rate series.
 */
import { hourEpoch, monthKeyToEpoch } from '../lib/dates';
import { getInitials } from '../lib/initials';

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

/** Population keyed by NTA code; value is [pop2010, pop2020] — index 1 is used. */
type Population = Record<string, [unknown, number]>;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * The display whitelist of complaint-type codes (legacy 311 `validComplaintTypes`).
 * Post-2014 categories that don't map to one of these are dropped from the
 * per-type breakdown, exactly as the 2015 build dropped unrecognized ones.
 */
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

/**
 * Map a raw 311 `complaint_type` string to its short code (port of the legacy
 * `normalizeInitials` in apps/311/format-data.coffee). Folds the categories that
 * were renamed/merged over the dataset's life so a code is stable across years.
 *
 * One deliberate improvement over the 2015 build: all "Noise - <variant>"
 * categories fold into `nois`. The legacy code only caught two variants by their
 * truncated initials, so it silently dropped "Noise - Residential" — the #2
 * complaint citywide — from the per-type breakdown. We fold every noise
 * *complaint* (but not the "Noise Survey" DEP measurement program).
 */
export function normalizeComplaintType(raw: string): string {
  const name = raw.trim();
  if (/^noise( -|$)/i.test(name)) return 'nois';
  let i = getInitials(name, 3).toLowerCase();
  if (i === 'heawat') i = 'heat'; // "Heat/Hot Water" (post-2014 rename)
  if (i === 'damtre' || i === 'ovetre') i = 'deatre'; // Damaged/Overgrown Tree -> dead/dying tree
  if (i === 'miscol(almat') i = 'miscol';
  return i;
}

interface CacheShape {
  version: 1;
  /** Max `created_date` ingested, ISO — the incremental refresh resumes here. */
  maxDate: string;
  /** Per-NTA monthly totals: { nta: { "YYYY-MM": count } }. */
  monthly: Record<string, Record<string, number>>;
  /** Per-NTA per-type hour-of-day histograms: { nta: { type: number[24] } }. */
  hourly: Record<string, Record<string, number[]>>;
}

/** Streaming, serializable accumulator for 311 counts. */
export class ComplaintAccumulator {
  private monthly: Record<string, Record<string, number>> = {};
  private hourly: Record<string, Record<string, number[]>> = {};
  maxDate = '';

  /** Ingest one geocoded complaint. `month` is 1-based; `typeCode` is normalized. */
  add(nta: string, year: number, month: number, hour: number, typeCode: string): void {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    this.monthly[nta] ??= {};
    this.monthly[nta][monthKey] = (this.monthly[nta][monthKey] ?? 0) + 1;

    if (hour >= 0 && hour < 24 && VALID_COMPLAINT_TYPES.includes(typeCode)) {
      const types = (this.hourly[nta] ??= {});
      const hist = (types[typeCode] ??= new Array(24).fill(0));
      hist[hour] += 1;
    }
  }

  /** Track the latest raw `created_date` seen (for incremental resume). */
  observeDate(isoDate: string): void {
    if (isoDate > this.maxDate) this.maxDate = isoDate;
  }

  toJSON(): CacheShape {
    return { version: 1, maxDate: this.maxDate, monthly: this.monthly, hourly: this.hourly };
  }

  static fromJSON(cache: CacheShape): ComplaintAccumulator {
    const acc = new ComplaintAccumulator();
    acc.monthly = cache.monthly;
    acc.hourly = cache.hourly;
    acc.maxDate = cache.maxDate;
    return acc;
  }

  /** Contiguous "YYYY-MM" axis from the earliest to latest month with data. */
  private monthAxis(): string[] {
    let min = '9999-99';
    let max = '0000-00';
    for (const nta of Object.keys(this.monthly)) {
      for (const key of Object.keys(this.monthly[nta])) {
        if (key < min) min = key;
        if (key > max) max = key;
      }
    }
    if (max < min) return [];
    const [minY, minM] = min.split('-').map(Number);
    const [maxY, maxM] = max.split('-').map(Number);
    const axis: string[] = [];
    for (let y = minY, m = minM; y < maxY || (y === maxY && m <= maxM); ) {
      axis.push(`${y}-${String(m).padStart(2, '0')}`);
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
    return axis;
  }

  /**
   * Produce the 311 display JSON.
   *
   * @param names       NTA-code -> name (the residential key set + "ALL")
   * @param population  population keyed by NTA (index 1 = 2020 count)
   * @param nowMs       reference instant for the hour-of-day axis (reproducible)
   */
  finalize(
    names: Record<string, string>,
    population: Population,
    nowMs: number,
  ): ThreeOneOneDisplayData {
    const ntaCodes = Object.keys(names);
    const axis = this.monthAxis();
    const formatDecimal = (n: number): number => Number(n.toFixed(2));

    const popOf = (nta: string): number => population[nta]?.[1] ?? 0;
    const ratePerThousand = (count: number, pop: number): number =>
      count < 1 || pop < 1 ? 0 : formatDecimal(count / (pop / 1000));

    // Borough/citywide totals for the ALL -mean series.
    const popTotal = ntaCodes.reduce((sum, nta) => sum + popOf(nta), 0);

    const out: ThreeOneOneDisplayData = {};
    for (const nta of ntaCodes) {
      const monthlyCounts = this.monthly[nta] ?? {};
      const hourlyByType = this.hourly[nta] ?? {};

      const complaintTally: DateValue[] = axis.map((monthKey) => {
        const [y, m] = monthKey.split('-').map(Number);
        const key = `${m}-${y}`;
        return {
          date: monthKeyToEpoch(key),
          value:
            nta === 'ALL'
              ? ratePerThousand(this.totalForMonth(monthKey, ntaCodes), popTotal)
              : ratePerThousand(monthlyCounts[monthKey] ?? 0, popOf(nta)),
        };
      });

      const complaintType: Record<string, DateValue[]> = {};
      for (const type of VALID_COMPLAINT_TYPES) {
        const hist = nta === 'ALL' ? this.totalHourly(type, ntaCodes) : (hourlyByType[type] ?? []);
        const pop = nta === 'ALL' ? popTotal : popOf(nta);
        complaintType[type] = HOURS.map((hour) => ({
          date: hourEpoch(hour, nowMs),
          value: ratePerThousand(hist[hour] ?? 0, pop),
        }));
      }

      const data: NeighborhoodComplaintData = { complaintTally, complaintType };
      if (nta === 'ALL') data['complaintTally-mean'] = complaintTally;
      out[nta] = data;
    }
    return out;
  }

  private totalForMonth(monthKey: string, ntaCodes: string[]): number {
    let total = 0;
    for (const nta of ntaCodes) total += this.monthly[nta]?.[monthKey] ?? 0;
    return total;
  }

  private totalHourly(type: string, ntaCodes: string[]): number[] {
    const total = new Array(24).fill(0);
    for (const nta of ntaCodes) {
      const hist = this.hourly[nta]?.[type];
      if (hist) for (let h = 0; h < 24; h++) total[h] += hist[h];
    }
    return total;
  }
}

/** In-memory record (test/convenience input). */
export interface ComplaintRecord {
  complaintType: string;
  nta: string;
  month: number;
  year: number;
  hour: number;
}

/**
 * Convenience wrapper: aggregate an in-memory record array (used by tests and
 * small jobs). Production builds stream into a `ComplaintAccumulator` directly.
 */
export function aggregateComplaints(
  complaints: ComplaintRecord[],
  _complaintTypes: Record<string, string>,
  names: Record<string, string>,
  population: Population,
  nowMs: number,
): ThreeOneOneDisplayData {
  const acc = new ComplaintAccumulator();
  for (const c of complaints) {
    if (!names[c.nta]) continue;
    acc.add(c.nta, c.year, c.month, c.hour, c.complaintType);
  }
  return acc.finalize(names, population, nowMs);
}
