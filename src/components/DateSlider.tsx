/**
 * Date slider — typed React + D3 v7 port of `components/slider/index.coffee`.
 *
 * The legacy control used `d3.svg.brush` reduced to a single handle that snapped
 * to the nearest date and pushed `?date=` into the URL. Here it is a controlled
 * component: a draggable handle over a `scaleTime` track that calls `onChange`
 * with the snapped date. D3 owns the scale/ticks; React owns the handle and drag
 * (pointer events) instead of `d3.svg.brush` + `d3.mouse`. URL wiring lives with
 * the page via `serializeGraphState({ kind: 'date', … })`.
 */
import { scaleTime } from 'd3';
import { useRef, useState } from 'react';

import { Axis } from '@/components/Axis';
import { getYearTickCount, snapToNearest } from '@/lib/slider';
import type { Margin } from '@/types';

const DEFAULT_MARGIN: Margin = { top: 0, left: 15, right: 15, bottom: 0 };

export interface DateSliderProps {
  /** Sorted selectable dates (epoch ms). */
  dates: number[];
  /** Currently selected date (epoch ms). */
  value: number;
  /** Called with the snapped date as the handle moves. */
  onChange: (date: number) => void;
  width: number;
  height?: number;
  margin?: Margin;
  id?: string;
}

export function DateSlider({
  dates,
  value,
  onChange,
  width,
  height = 38,
  margin = DEFAULT_MARGIN,
  id,
}: DateSliderProps) {
  const trackRef = useRef<SVGGElement>(null);
  const [dragging, setDragging] = useState(false);

  const x = scaleTime()
    .range([0, width])
    .clamp(true)
    .domain([dates[0], dates[dates.length - 1]]);

  const updateFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const px = clientX - track.getBoundingClientRect().left;
    const snapped = snapToNearest(dates, Number(x.invert(px)));
    onChange(snapped);
  };

  return (
    <svg
      id={id}
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
    >
      <g ref={trackRef} transform={`translate(${margin.left},${margin.top})`}>
        <Axis
          scale={x}
          orientation="bottom"
          tickCount={getYearTickCount(dates)}
          transform={`translate(0,${height / 2})`}
        />
        <rect
          y={height / 2 - 10}
          width={width}
          height={20}
          style={{ fill: 'none', pointerEvents: 'all', cursor: 'pointer' }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            updateFromClientX(e.clientX);
          }}
          onPointerMove={(e) => dragging && updateFromClientX(e.clientX)}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setDragging(false);
          }}
        />
        <circle
          className="handle"
          r={10}
          cx={x(value)}
          transform={`translate(0,${height / 2})`}
          style={{ pointerEvents: 'none' }}
        />
      </g>
    </svg>
  );
}
