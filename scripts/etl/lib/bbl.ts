/**
 * BBL (Borough-Block-Lot) helpers — typed port of
 * `components/numberutils/bbl.coffee`. Used by the brooklyn geocoding step.
 */

/** Left-pad a number/string with zeros to `targetLength`. */
export function leftPad(value: number | string, targetLength: number): string {
  let output = String(value);
  while (output.length < targetLength) output = '0' + output;
  return output;
}

/** Build a 10-char BBL from borough (1 digit), block (5), lot (4). */
export function formatBBL(
  borough: number | string,
  block: number | string,
  lot: number | string,
): string {
  return `${borough}${leftPad(block, 5)}${leftPad(lot, 4)}`;
}
