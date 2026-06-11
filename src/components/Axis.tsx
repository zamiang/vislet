/**
 * Reusable SVG axis rendered as JSX — the React-owns-the-DOM replacement for
 * the legacy `d3.svg.axis().scale(…).orient(…).call(g)` pattern used by
 * `line-graph`, `area-chart`, and `slider`. D3 still owns the math: we read tick
 * values and the formatter off the scale, then render `<line>`/`<text>`/domain
 * `<path>` ourselves so D3 never mutates a node React manages.
 */

/** Minimal structural type satisfied by both `scaleLinear` and `scaleTime`. */
export interface TickScale<T extends number | Date> {
  (value: T): number;
  ticks(count?: number): T[];
  tickFormat(count?: number, specifier?: string): (value: T) => string;
  range(): number[];
}

export interface AxisProps<T extends number | Date> {
  scale: TickScale<T>;
  orientation: 'bottom' | 'left';
  /** Desired tick count (or a d3 time interval count). Ignored if `tickValues` given. */
  tickCount?: number;
  /** Explicit tick values, overriding `scale.ticks()`. */
  tickValues?: T[];
  /** Tick label formatter, overriding `scale.tickFormat()`. */
  tickFormat?: (value: T) => string;
  /** Inner tick length in px (d3 default 6). */
  tickSizeInner?: number;
  /** Gap between tick and label in px (d3 default 3). */
  tickPadding?: number;
  /** SVG transform applied to the axis group (e.g. `translate(0,height)`). */
  transform?: string;
  className?: string;
}

export function Axis<T extends number | Date>({
  scale,
  orientation,
  tickCount,
  tickValues,
  tickFormat,
  tickSizeInner = 6,
  tickPadding = 3,
  transform,
  className,
}: AxisProps<T>) {
  const ticks = tickValues ?? scale.ticks(tickCount);
  const format = tickFormat ?? scale.tickFormat(tickCount);
  const range = scale.range();
  const [r0, r1] = [range[0], range[range.length - 1]];

  const isBottom = orientation === 'bottom';
  // Direction the ticks point: down (+y) for bottom, left (-x) for left.
  const sign = isBottom ? 1 : -1;
  const labelOffset = tickSizeInner + tickPadding;

  // Domain line spanning the scale's range, on the appropriate edge.
  const domainPath = isBottom ? `M${r0},0H${r1}` : `M0,${r0}V${r1}`;

  return (
    <g className={`axis ${className ?? ''}`.trim()} transform={transform}>
      <path className="domain" d={domainPath} fill="none" stroke="currentColor" />
      {ticks.map((tick, i) => {
        const pos = scale(tick);
        const tickTransform = isBottom ? `translate(${pos},0)` : `translate(0,${pos})`;
        return (
          <g className="tick" transform={tickTransform} key={i}>
            <line
              stroke="currentColor"
              x2={isBottom ? 0 : sign * tickSizeInner}
              y2={isBottom ? sign * tickSizeInner : 0}
            />
            <text
              fill="currentColor"
              x={isBottom ? 0 : sign * labelOffset}
              y={isBottom ? sign * labelOffset : 0}
              dy={isBottom ? '0.71em' : '0.32em'}
              textAnchor={isBottom ? 'middle' : 'end'}
            >
              {format(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
