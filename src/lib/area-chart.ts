/**
 * Pure data helpers for the stacked area chart — ported from
 * `components/area-chart/index.coffee`.
 *
 * The legacy chart used `d3.layout.stack()`, removed in D3 v4+. Rather than
 * adapt to v7's transposed `d3.stack()` (which expects one row per x-position
 * keyed by series), we reproduce v3's behavior directly: series are stacked in
 * domain order and each point gets a `y0` baseline equal to the running sum of
 * the series below it at the same time index. This keeps the math explicit and
 * unit-testable.
 */

/** Legacy `d3.scale.category20c` palette, vendored — the scheme was removed in D3 v7. */
export const CATEGORY_20C = [
	'#3182bd',
	'#6baed6',
	'#9ecae1',
	'#c6dbef',
	'#e6550d',
	'#fd8d3c',
	'#fdae6b',
	'#fdd0a2',
	'#31a354',
	'#74c476',
	'#a1d99b',
	'#c7e9c0',
	'#756bb1',
	'#9e9ac8',
	'#bcbddd',
	'#dadaeb',
	'#636363',
	'#969696',
	'#bdbdbd',
	'#d9d9d9',
];

/** Raw input point as stored in the display JSON. */
export interface AreaInputPoint {
	date: number | string;
	value: number;
}

/** A stacked point: its own height `y` plus the baseline `y0`. */
export interface AreaPoint {
	date: number;
	y: number;
	y0: number;
}

export interface AreaSeries {
	name: string;
	values: AreaPoint[];
}

/** `series name → time key → point`. Mirrors `data[dataset][keys[0]]`. */
export type AreaData = Record<string, Record<string, AreaInputPoint>>;

/** The sorted, filtered series names (the color/stack domain). Mirrors `@color.domain()`. */
export function areaDomain(data: AreaData, ignoredIds: string[] = []): string[] {
	return Object.keys(data)
		.sort()
		.filter((name) => !ignoredIds.includes(name));
}

/**
 * Build stacked series in domain order. Each series' points are sorted by date
 * and assigned a `y0` baseline = the sum of the preceding series' `y` at the
 * same index. Mirrors `getLines` + `d3.layout.stack`.
 */
export function stackAreaSeries(data: AreaData, ignoredIds: string[] = []): AreaSeries[] {
	const domain = areaDomain(data, ignoredIds);

	const series: AreaSeries[] = domain.map((name) => ({
		name,
		values: Object.values(data[name])
			.map((d) => ({ date: Number(d.date), y: d.value, y0: 0 }))
			.sort((a, b) => a.date - b.date),
	}));

	// Stack: y0 of series i at index n = running total of series 0..i-1 at n.
	const baselines: number[] = [];
	for (const s of series) {
		s.values.forEach((point, n) => {
			point.y0 = baselines[n] ?? 0;
			baselines[n] = point.y0 + point.y;
		});
	}
	return series;
}

/** Max stacked total across all time indices — the natural top of the y domain. */
export function areaYMax(series: AreaSeries[]): number {
	const length = series[0]?.values.length ?? 0;
	let max = 0;
	for (let n = 0; n < length; n++) {
		let total = 0;
		for (const s of series) total += s.values[n]?.y ?? 0;
		if (total > max) max = total;
	}
	return max;
}
