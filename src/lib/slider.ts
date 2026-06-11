/**
 * Pure helpers for the date slider — ported from `components/slider/index.coffee`.
 *
 * The legacy control used `d3.svg.brush` (removed/reworked in D3 v4+) but
 * stripped the brush's extent/resize/background, leaving a single handle that
 * snapped to the nearest date. We reproduce just that: a snap function plus the
 * tick count. The component drives a controlled handle; D3 owns the time scale.
 */
import { bisector } from 'd3';

const bisect = bisector<number, number>((d) => d).right;

/**
 * Snap an arbitrary instant `x0` (epoch ms) to the nearest value in the sorted
 * `dates` array. Mirrors the legacy bisector snap (ties resolve to the lower
 * date, matching its `>` comparison).
 */
export function snapToNearest(dates: number[], x0: number): number {
	if (dates.length === 0) return x0;
	const i = bisect(dates, x0);
	const d0 = dates[i - 1];
	const d1 = dates[i];
	if (d0 == null) return d1;
	if (d1 == null) return d0;
	return x0 - d0 > d1 - x0 ? d1 : d0;
}

/**
 * Number of axis ticks: 4 per year across the date span. Mirrors the *intent*
 * of legacy `getNumberTicks` (whose `getFullYear(arg)` call was a no-op bug that
 * effectively used the current year).
 */
export function getYearTickCount(dates: number[], ticksPerYear = 4): number {
	if (dates.length === 0) return 0;
	const firstYear = new Date(dates[0]).getFullYear();
	const lastYear = new Date(dates[dates.length - 1]).getFullYear();
	return (lastYear - firstYear) * ticksPerYear;
}
