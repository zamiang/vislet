/**
 * Pure aggregation for the "cheapest grew fastest" scatter on the Brooklyn page:
 * each neighborhood's current price level vs. its growth since the start of the
 * series. Kept DOM/D3-free so it can be unit-tested; the component layers scales
 * and JSX on top.
 *
 * Growth uses yearly averages of the quarterly `residentialPrices` medians (so a
 * single noisy quarter does not define the endpoints): the earliest year with
 * data is the base, the latest is the current level.
 */
import type { BrooklynData, DataPoint } from '@/types';

export interface ScatterPoint {
  id: string;
  name: string;
  /** Latest-year average $/sqft. */
  current: number;
  /** Fractional growth from the base year (0.8 = +80%). */
  growth: number;
  /** Quarters with data, out of the full axis — low values are unreliable. */
  quarters: number;
  totalQuarters: number;
  /** True when coverage is too thin to trust the trend. */
  sparse: boolean;
}

/** Average the non-zero points within each calendar year. */
function yearAverages(points: DataPoint[]): Map<number, number> {
  const sums = new Map<number, { total: number; n: number }>();
  for (const p of points) {
    if (!p.value) continue;
    const year = new Date(p.date).getUTCFullYear();
    const acc = sums.get(year) ?? { total: 0, n: 0 };
    acc.total += p.value;
    acc.n += 1;
    sums.set(year, acc);
  }
  const avgs = new Map<number, number>();
  for (const [year, { total, n }] of sums) avgs.set(year, total / n);
  return avgs;
}

export interface ScatterOptions {
  /** Neighborhood id → display name. */
  names: Record<string, string>;
  /** Ids to skip (parks, non-residential), matched by substring. */
  ignoredIds?: string[];
  /** Coverage fraction below which a neighborhood is flagged `sparse`. */
  sparseThreshold?: number;
}

export function computeGrowthScatter(
  salesData: BrooklynData,
  { names, ignoredIds = [], sparseThreshold = 0.8 }: ScatterOptions,
): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (const [id, data] of Object.entries(salesData)) {
    if (id === 'ALL') continue;
    if (ignoredIds.some((ignored) => id.includes(ignored))) continue;

    const series = data.residentialPrices ?? [];
    const totalQuarters = series.length;
    const quarters = series.filter((p) => p.value > 0).length;

    const avgs = yearAverages(series);
    const years = [...avgs.keys()].sort((a, b) => a - b);
    if (years.length < 2) continue;
    const base = avgs.get(years[0]);
    const current = avgs.get(years[years.length - 1]);
    if (!base || !current) continue;

    points.push({
      id,
      name: names[id] ?? id,
      current: Math.round(current),
      growth: current / base - 1,
      quarters,
      totalQuarters,
      sparse: totalQuarters > 0 && quarters / totalQuarters < sparseThreshold,
    });
  }
  return points;
}
