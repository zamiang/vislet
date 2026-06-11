/**
 * Pure choropleth color logic — ported from `components/svg-map/color.coffee`.
 *
 * The legacy code built a `d3.scale.quantile` over `[min, max]` mapping into 9
 * CSS classes (`color0`…`color8`) and rendered a color key from the scale's
 * range + quantiles. Kept DOM-free for unit testing; `SvgMap` applies the
 * classes and renders the key.
 */
import { range, scaleQuantile } from 'd3';

import type { ColorDatum } from '@/types';

/** Number of choropleth buckets (CSS classes `color0`…`color8`). */
export const COLOR_CLASS_COUNT = 9;

export type ColorScale = ReturnType<typeof buildColorScale>;

/**
 * A quantile scale over `[min, max]` whose range is the 9 `colorN` class names.
 * Mirrors `getColorClass` (input must be ascending).
 */
export function buildColorScale(min: number, max: number) {
	return scaleQuantile<string>()
		.domain([min, max])
		.range(range(COLOR_CLASS_COUNT).map((i) => `color${i}`));
}

/** Map each datum's `id` to its color class. Mirrors the `hash` in `colorMap`. */
export function classifyColors(
	data: ColorDatum[],
	min: number,
	max: number,
): { classes: Map<string, string>; range: string[]; quantiles: number[] } {
	const scale = buildColorScale(min, max);
	const classes = new Map<string, string>();
	for (const { id, value } of data) {
		classes.set(id, scale(value));
	}
	return { classes, range: scale.range(), quantiles: scale.quantiles() };
}

/**
 * Format color-key breakpoint values, mirroring `drawColorKey`: values under 1M
 * become integers with separators; ≥1M become `"<n>m"` (millions, 2 decimals).
 */
export function formatKeyValues(values: number[]): string[] {
	return values.map((value) => {
		if (value < 1_000_000) return Number(value.toFixed(0)).toLocaleString();
		return `${Number((value / 1_000_000).toFixed(2)).toLocaleString()}m`;
	});
}
