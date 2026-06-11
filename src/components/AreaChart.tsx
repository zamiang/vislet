/**
 * Stacked area chart — typed React + D3 v7 port of
 * `components/area-chart/index.coffee`. Stacking math lives in
 * `@/lib/area-chart` (replacing the removed `d3.layout.stack`); the ordinal
 * color scale uses the vendored `CATEGORY_20C` palette (`d3.scale.category20c`
 * was removed in v7). React renders the `<path>`s; D3 owns scales/shape/axes.
 */
import { area as d3area, curveCardinal, curveLinear, extent, format, scaleLinear, scaleOrdinal, scaleTime } from 'd3';

import { Axis } from '@/components/Axis';
import { Legend, type LegendEntry } from '@/components/Legend';
import { type AreaData, type AreaPoint, CATEGORY_20C, areaYMax, stackAreaSeries } from '@/lib/area-chart';
import type { Margin } from '@/types';

const DEFAULT_MARGIN: Margin = { top: 10, left: 50, right: 0, bottom: 20 };

/** Legacy default: `.1%` with a trailing `.0` stripped (e.g. `12.0%` → `12%`). */
const defaultYFormat = (x: number) => format('.1%')(x).replace(/\.0+%$/, '%');

export interface AreaChartProps {
  data: AreaData;
  width: number;
  height: number;
  margin?: Margin;
  interpolate?: 'cardinal' | 'linear';
  /** Series names to exclude from the stack/color domain. */
  ignoredIds?: string[];
  /** y-axis tick formatter (default: percent). */
  yAxisFormat?: (value: number) => string;
  /** Compute the y domain as `[0, maxStackedTotal * 1.3]`; otherwise `[0, 1]` (percent). */
  computeYDomain?: boolean;
  label?: string;
  /** When provided, renders a legend mapping a series name to its label. */
  keyLabel?: (name: string) => string;
}

export function AreaChart({
  data,
  width,
  height,
  margin = DEFAULT_MARGIN,
  interpolate = 'cardinal',
  ignoredIds = [],
  yAxisFormat = defaultYFormat,
  computeYDomain = false,
  label,
  keyLabel,
}: AreaChartProps) {
  const series = stackAreaSeries(data, ignoredIds);
  const color = scaleOrdinal<string, string>()
    .domain(series.map((s) => s.name))
    .range(CATEGORY_20C);

  const firstDates = series[0]?.values ?? [];
  const x = scaleTime()
    .range([0, width])
    .domain(extent(firstDates, (d) => d.date) as [number, number]);
  const y = scaleLinear()
    .range([height, 0])
    .domain(computeYDomain ? [0, areaYMax(series) * 1.3] : [0, 1]);

  const curve = interpolate === 'cardinal' ? curveCardinal : curveLinear;
  const areaPath = d3area<AreaPoint>()
    .curve(curve)
    .x((d) => x(d.date))
    .y0((d) => y(d.y0))
    .y1((d) => y(d.y0 + d.y));

  const legendEntries: LegendEntry[] | null = keyLabel
    ? series.map((s) => ({ color: color(s.name), text: keyLabel(s.name) }))
    : null;

  return (
    <>
      <svg width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {series.map((s) => (
            <g className="building-type" key={s.name}>
              <path className="area" d={areaPath(s.values) ?? undefined} style={{ fill: color(s.name) }} />
            </g>
          ))}

          <Axis scale={x} orientation="bottom" transform={`translate(0,${height})`} className="x" />
          <Axis scale={y} orientation="left" tickFormat={yAxisFormat} className="y y-axis" />

          {label && (
            <text className="label-text" x={10} y={margin.top} textAnchor="start">
              {label}
            </text>
          )}
        </g>
      </svg>
      {legendEntries && <Legend entries={legendEntries} marginLeft={margin.left} />}
    </>
  );
}
