/**
 * Interactive tooltip overlay — typed React port of the `svg-tooltips` mixin
 * (`components/svg-tooltips/index.coffee`), composed into `LineGraph` /
 * `AreaChart`. Renders a transparent capture `<rect>` plus a per-series marker
 * (circle + label) that tracks the nearest point under the cursor.
 *
 * The legacy version used `d3.mouse` + `Backbone`/jQuery throttling and mutated
 * the DOM; here React owns the marks and the pure nearest-point/format math
 * lives in `@/lib/tooltip`. Renders inside the chart's translated `<g>`, so all
 * coordinates are chart-space.
 */
import { useState } from 'react';

import { findNearestPoint, formatOutput } from '@/lib/tooltip';
import type { Series } from '@/types';

/** Minimal point shape the overlay needs: a numeric date plus caller-supplied accessors. */
export interface TooltipLayerProps<P extends { date: number }> {
	lines: Series<P>[];
	/** x scale with `invert` (e.g. `scaleTime`); maps date↔px. */
	xScale: { (value: number): number; invert(px: number): Date | number };
	/** y scale mapping a value to px. */
	yScale: (value: number) => number;
	width: number;
	height: number;
	/** Value used for vertical placement (line: `point.value`; area: `y0+y`). */
	value: (point: P) => number;
	/** Value used for the label text (line: `point.value`; area: `y`). */
	displayValue: (point: P) => number;
	/** Suffix passed to `formatOutput` (legacy `tooltipFormat`, default `" %"`). */
	suffix?: string;
	color: (name: string) => string;
}

export function TooltipLayer<P extends { date: number }>({
	lines,
	xScale,
	yScale,
	width,
	height,
	value,
	displayValue,
	suffix,
	color,
}: TooltipLayerProps<P>) {
	// Cursor x in chart space (px), or null when not hovering.
	const [hoverX, setHoverX] = useState<number | null>(null);
	const x0 = hoverX == null ? null : Number(xScale.invert(hoverX));

	return (
		<>
			{x0 != null &&
				lines.map((line, index) => {
					const point = findNearestPoint(line.values, x0);
					if (!point) return null;
					const text = formatOutput(displayValue(point), suffix);
					if (text == null) return null;
					// Alternate label sides to reduce overlap (legacy index % 2).
					const labelX = index % 2 ? -8 : 8;
					return (
						<g
							className={`tooltips tooltip-${line.name}`}
							transform={`translate(${xScale(point.date)},${yScale(value(point))})`}
							style={{ pointerEvents: 'none' }}
							key={line.name}
						>
							<circle
								r={4}
								className="tooltip-circle"
								style={{ stroke: line.name.includes('-mean') ? 'lightgrey' : color(line.name) }}
							/>
							<text
								className="tooltip-label"
								transform={`translate(${labelX}, 4)`}
								textAnchor={index % 2 ? 'end' : 'start'}
							>
								{text}
							</text>
						</g>
					);
				})}
			<rect
				width={width}
				height={height}
				style={{ fill: 'none', pointerEvents: 'all' }}
				onMouseMove={(e) => setHoverX(e.nativeEvent.offsetX)}
				onMouseLeave={() => setHoverX(null)}
			/>
		</>
	);
}
