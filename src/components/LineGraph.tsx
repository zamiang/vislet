/**
 * Line chart — typed React + D3 v7 port of `components/line-graph/index.coffee`
 * (plus its `trend`, `key`, and `percent` variants). D3 owns the math
 * (`scaleTime`, `scaleLinear`, `line`, `area`, yearly ticks); React renders the
 * `<path>`/`<g>`/labels. Interactive tooltips are layered separately.
 *
 * Legacy `interpolate: 'cardinal'` → `curveCardinal`. The legacy `displayKey`
 * doubled as a flag and an id→label formatter; here that is the explicit
 * `keyLabel` prop.
 */
import {
  area as d3area,
  line as d3line,
  curveCardinal,
  curveLinear,
  extent,
  scaleLinear,
  scaleTime,
  timeYear,
} from 'd3';

import { Axis } from '@/components/Axis';
import { Legend, type LegendEntry } from '@/components/Legend';
import { type LineGraphData, getFlattenedData, getLines, lineColor, yDomain } from '@/lib/line-chart';
import type { DataPoint, Margin, Series, TrendPoint } from '@/types';

const DEFAULT_MARGIN: Margin = { top: 10, left: 50, right: 0, bottom: 20 };

export interface LineGraphProps {
  data: LineGraphData;
  keys: string[];
  startingDataset: string;
  width: number;
  height: number;
  margin?: Margin;
  /** `'cardinal'` (default, → curveCardinal) or `'linear'`. */
  interpolate?: 'cardinal' | 'linear';
  /** y-axis tick formatter. */
  yAxisFormat?: (value: number) => string;
  /** Axis label drawn top-left. */
  label?: string;
  /** Render per-line end labels. */
  displayLineLabels?: boolean;
  /** Render the trend (inter-quartile) band; requires points with `pct25`/`pct75`. */
  displayTrend?: boolean;
  /** When provided, renders a legend; maps a series id/name to its label. */
  keyLabel?: (idOrName: string) => string;
}

function hasTrend(values: DataPoint[]): values is TrendPoint[] {
  const first = values[0] as Partial<TrendPoint> | undefined;
  return first != null && typeof first.pct25 === 'number' && typeof first.pct75 === 'number';
}

export function LineGraph({
  data,
  keys,
  startingDataset,
  width,
  height,
  margin = DEFAULT_MARGIN,
  interpolate = 'cardinal',
  yAxisFormat,
  label,
  displayLineLabels = false,
  displayTrend = false,
  keyLabel,
}: LineGraphProps) {
  const flattened = getFlattenedData(data, keys, startingDataset);
  const lines = getLines(flattened, startingDataset).filter((line) => line.values.length > 0);
  const first = flattened[Object.keys(flattened)[0]] ?? [];

  const x = scaleTime()
    .range([0, width])
    .domain(extent(first, (d) => d.date) as [number, number]);
  const y = scaleLinear().range([height, 0]).domain(yDomain(lines));

  const curve = interpolate === 'cardinal' ? curveCardinal : curveLinear;
  const linePath = d3line<DataPoint>()
    .curve(curve)
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  const trendArea = d3area<TrendPoint>()
    .curve(curve)
    .x((d) => x(d.date))
    .y0((d) => y(d.pct75))
    .y1((d) => y(d.pct25));

  const legendEntries: LegendEntry[] | null = keyLabel
    ? lines.map((line) => ({ color: lineColor(line.name), text: keyLabel(line.id ?? line.name) }))
    : null;

  return (
    <>
      <svg width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {lines.map((line) => (
            <g className="sales" key={line.name}>
              {displayTrend && hasTrend(line.values) && (
                <path className="trend-area" d={trendArea(line.values) ?? undefined} />
              )}
              <path className="line" d={linePath(line.values) ?? undefined} style={{ stroke: lineColor(line.name) }} />
              {displayLineLabels && <LineLabel line={line} x={x} y={y} />}
            </g>
          ))}

          <Axis
            scale={x}
            orientation="bottom"
            transform={`translate(0,${height})`}
            tickValues={x.ticks(timeYear)}
            className="x-axis"
          />
          <Axis scale={y} orientation="left" tickCount={7} tickFormat={yAxisFormat} className="y-axis" />

          {label && (
            <text className="label-text" x={10} y={5} dy="1em" textAnchor="start">
              {label}
            </text>
          )}
        </g>
      </svg>
      {legendEntries && <Legend entries={legendEntries} marginLeft={margin.left} />}
    </>
  );
}

function LineLabel({
  line,
  x,
  y,
}: {
  line: Series;
  x: (value: number) => number;
  y: (value: number) => number;
}) {
  const last = line.values[line.values.length - 1];
  if (!last) return null;
  return (
    <text
      className="line-label"
      transform={`translate(${x(last.date)},${y(last.value)})`}
      x={3}
      style={{ fill: lineColor(line.name) }}
    >
      {line.name}
    </text>
  );
}
