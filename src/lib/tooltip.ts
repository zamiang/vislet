/**
 * Pure helpers for chart tooltips — ported from `components/svg-tooltips/index.coffee`
 * (`formatOutput`, the bisector-based nearest-point lookup). Kept free of DOM so
 * they can be unit-tested; the `<TooltipLayer>` component layers interaction on top.
 */
import { bisector } from 'd3';

const bisectDate = bisector<{ date: number }, number>((d) => d.date).right;

/**
 * The point in `values` nearest `x0` (a date in epoch ms), matching the legacy
 * bisector logic: find the insertion index, then pick whichever neighbor is
 * closer. Returns `undefined` for empty input. Works for any point carrying a
 * numeric `date` (line `DataPoint`s and stacked `AreaPoint`s alike).
 */
export function findNearestPoint<P extends { date: number }>(
  values: P[],
  x0: number,
): P | undefined {
  if (values.length === 0) return undefined;
  const i = bisectDate(values, x0);
  const d0 = values[i - 1];
  const d1 = values[i];
  if (!d0) return d1;
  if (!d1) return d0;
  return x0 - d0.date > d1.date - x0 ? d1 : d0;
}

/**
 * Format a tooltip value, mirroring `svg-tooltips` `formatOutput`:
 * - `> 100` → integer with thousands separators
 * - `> 1`   → 2 decimals with thousands separators
 * - `0 < v ≤ 1` → percent with the configured suffix (default `" %"`)
 * - otherwise → `null` (no tooltip)
 */
export function formatOutput(value: number, suffix = ' %'): string | null {
  if (value > 100) return Number(value.toFixed(0)).toLocaleString();
  if (value > 1) return Number(value.toFixed(2)).toLocaleString();
  if (value > 0) return `${(value * 100).toFixed(2)}${suffix}`;
  return null;
}
