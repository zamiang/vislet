/**
 * Pure data helpers for the line graph — ported from `line-graph/index.coffee`
 * (`getFlattenedData`, `getLines`, `color`) and its y-domain computation. Kept
 * free of D3/DOM so they can be unit-tested; the component layers D3 scales and
 * JSX rendering on top.
 */
import { max, min } from 'd3-array';

import type { DataPoint, Series } from '@/types';

/** `dataset name → series key → points`. */
export type LineGraphData = Record<string, Record<string, DataPoint[]>>;

const MEAN_SUFFIX = '-mean';

/**
 * Pick the points for each requested key out of the dataset.
 * `…-mean` keys always come from the `ALL` dataset (the borough average);
 * everything else comes from `startingDataset`. Mirrors `getFlattenedData`.
 */
export function getFlattenedData(
  data: LineGraphData,
  keys: string[],
  startingDataset: string,
): Record<string, DataPoint[]> {
  const flattened: Record<string, DataPoint[]> = {};
  for (const key of keys) {
    if (key.includes(MEAN_SUFFIX)) {
      const points = data['ALL']?.[key];
      if (points) flattened[key] = points;
    } else if (data[startingDataset]) {
      const points = data[startingDataset][key];
      if (points) flattened[key] = points;
    }
  }
  return flattened;
}

/**
 * Build the renderable series from flattened data, appending the optional
 * compare-dataset line. Mirrors `getLines`. `…-mean` series are labeled
 * "Borough Average"; others carry the active dataset id.
 */
export function getLines(
  flattened: Record<string, DataPoint[]>,
  startingDataset: string,
  options: {
    compareDataset?: string;
    compareData?: Record<string, DataPoint[]>;
    keys?: string[];
  } = {},
): Series[] {
  const names = Object.keys(flattened);
  const lines: Series[] = names.map((name) => ({
    id: name.includes(MEAN_SUFFIX) ? 'Borough Average' : startingDataset,
    name,
    values: flattened[name],
  }));

  const { compareDataset, compareData, keys } = options;
  if (compareDataset && compareData && keys?.length) {
    lines.push({ name: 'compare-dataset', id: compareDataset, values: compareData[keys[0]] ?? [] });
  } else {
    lines.push({ name: 'compare-dataset', values: [] });
  }
  return lines;
}

/** Series stroke color by name. Mirrors `line-graph/index.coffee` `color`. */
export function lineColor(name: string): string {
  if (name.includes(MEAN_SUFFIX)) return 'lightgray';
  if (name.includes('compare-')) return '#D53F50';
  return '#5a7684'; // Steel Blue (--primary) — shared Slate Executive palette
}

/** `[min, max]` value extent across all series (skips empty series). Mirrors the y-domain. */
export function yDomain(lines: Series[]): [number, number] {
  const lo = min(lines, (line) => min(line.values, (point) => point.value));
  const hi = max(lines, (line) => max(line.values, (point) => point.value));
  return [lo ?? 0, hi ?? 0];
}
