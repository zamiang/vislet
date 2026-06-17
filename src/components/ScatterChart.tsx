/**
 * Scatter chart for the Brooklyn write-up: current price level (x) vs. growth
 * since the start of the series (y), one dot per neighborhood. D3 owns the
 * scales; React renders the circles, axes, callout labels, and hover tooltip
 * (no `d3.select` mutation of React-owned nodes — same contract as LineGraph).
 *
 * Sparse neighborhoods (thin quarter coverage) render hollow + muted, since
 * their trend is unreliable.
 */
import { extent, max, scaleLinear } from 'd3';
import { useState } from 'react';

import { Axis } from '@/components/Axis';
import type { ScatterPoint } from '@/lib/neighborhood-scatter';
import type { Margin } from '@/types';

const DEFAULT_MARGIN: Margin = { top: 12, left: 52, right: 16, bottom: 40 };

export interface ScatterChartProps {
  data: ScatterPoint[];
  width: number;
  height: number;
  margin?: Margin;
  xLabel?: string;
  yLabel?: string;
  /** Click a dot to select that neighborhood (drives the map/line chart above). */
  onSelect?: (id: string) => void;
}

const fmtPct = (g: number) => `${g >= 0 ? '+' : ''}${Math.round(g * 100)}%`;
const fmtUsd = (v: number) => `$${v.toLocaleString()}`;

export function ScatterChart({
  data,
  width,
  height,
  margin = DEFAULT_MARGIN,
  xLabel = 'Current median $/sqft',
  yLabel = 'Growth',
  onSelect,
}: ScatterChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const x = scaleLinear()
    .range([0, width])
    .domain([0, (max(data, (d) => d.current) ?? 0) * 1.08])
    .nice();
  const yExtent = extent(data, (d) => d.growth) as [number, number];
  const y = scaleLinear()
    .range([height, 0])
    .domain([Math.min(0, yExtent[0]), (yExtent[1] ?? 0) * 1.08])
    .nice();

  // Callouts: the priciest, the fastest-growing, and the cheapest neighborhood —
  // the three points that carry the "cheap grew fastest, pricey plateaued" story.
  const dense = data.filter((d) => !d.sparse);
  const calloutIds = new Set(
    [
      maxBy(dense, (d) => d.current),
      maxBy(dense, (d) => d.growth),
      minBy(dense, (d) => d.current),
      // Always call out the sparse outlier so its hollow dot is explained.
      maxBy(
        data.filter((d) => d.sparse),
        (d) => d.totalQuarters - d.quarters,
      ),
    ]
      .filter((d): d is ScatterPoint => d != null)
      .map((d) => d.id),
  );

  const hovered = data.find((d) => d.id === hoverId);

  return (
    <svg
      className="scatter-chart"
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Zero-growth reference line. */}
        <line
          className="scatter-baseline"
          x1={0}
          x2={width}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />

        <Axis
          scale={x}
          orientation="bottom"
          transform={`translate(0,${height})`}
          tickFormat={(v) => fmtUsd(v as number)}
          className="x-axis"
        />
        <Axis
          scale={y}
          orientation="left"
          tickFormat={(v) => fmtPct(v as number)}
          className="y-axis"
        />

        {data.map((d) => {
          const isCallout = calloutIds.has(d.id);
          const active = hoverId === d.id;
          return (
            <circle
              key={d.id}
              cx={x(d.current)}
              cy={y(d.growth)}
              r={active || isCallout ? 6 : 4}
              className={`scatter-dot${d.sparse ? ' sparse' : ''}${isCallout ? ' callout' : ''}${active ? ' active' : ''}`}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onMouseEnter={() => setHoverId(d.id)}
              onMouseLeave={() => setHoverId((id) => (id === d.id ? null : id))}
              onClick={() => onSelect?.(d.id)}
            >
              <title>{`${d.name}: ${fmtUsd(d.current)}/sqft, ${fmtPct(d.growth)}`}</title>
            </circle>
          );
        })}

        {/* Static callout labels (skip when a hover label is up to avoid overlap). */}
        {!hovered &&
          data
            .filter((d) => calloutIds.has(d.id))
            .map((d) => (
              <text
                key={d.id}
                className="scatter-label"
                x={x(d.current) + 8}
                y={y(d.growth) - 6}
                textAnchor={x(d.current) > width - 90 ? 'end' : 'start'}
                dx={x(d.current) > width - 90 ? -16 : 0}
              >
                {d.name}
              </text>
            ))}

        {/* Hover label. */}
        {hovered && (
          <text
            className="scatter-label active"
            x={x(hovered.current) + 8}
            y={y(hovered.growth) - 6}
            textAnchor={x(hovered.current) > width - 90 ? 'end' : 'start'}
            dx={x(hovered.current) > width - 90 ? -16 : 0}
          >
            {`${hovered.name} — ${fmtUsd(hovered.current)}, ${fmtPct(hovered.growth)}`}
          </text>
        )}

        <text className="label-text" x={10} y={4} dy="1em" textAnchor="start">
          {yLabel}
        </text>
        <text className="label-text" x={width} y={height + margin.bottom - 6} textAnchor="end">
          {xLabel}
        </text>
      </g>
    </svg>
  );
}

function maxBy<T>(items: T[], score: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) => (best == null || score(item) > score(best) ? item : best),
    undefined,
  );
}

function minBy<T>(items: T[], score: (item: T) => number): T | undefined {
  return maxBy(items, (item) => -score(item));
}
