/**
 * Pure string/number helpers ported from the legacy `datautil/` and
 * `numberutils/` CoffeeScript modules. No D3, no DOM — unit-tested in
 * `__tests__/lib/format.test.ts`.
 */

/**
 * Initials for a name. For multi-word names, takes the first `len` characters
 * of each word and concatenates them; for single words, takes the first
 * `len + 1` characters. Mirrors legacy `datautil/get-initials.coffee`.
 */
export function getInitials(name: string, len = 2): string {
	const words = name.split(' ');
	if (words.length > 1) {
		return words.map((word) => word.substring(0, len)).join('');
	}
	return name.substring(0, len + 1);
}

/**
 * Turn a hyphenated machine name into a comma-separated display name
 * (e.g. `"foo-bar"` → `"foo, bar"`). Mirrors legacy `datautil/format-name.coffee`.
 */
export function formatName(name: string | null | undefined): string | undefined {
	return name?.split('-').join(', ');
}

/** Left-pad a number with zeros to `targetLength`. Mirrors legacy `numberutils/bbl.coffee`. */
export function leftPad(value: number | string, targetLength: number): string {
	let output = String(value);
	while (output.length < targetLength) {
		output = '0' + output;
	}
	return output;
}

/**
 * NYC Borough-Block-Lot identifier: 1-digit borough + 5-digit block + 4-digit lot.
 * Mirrors legacy `numberutils/bbl.coffee` `formatBBL`.
 */
export function formatBBL(
	borough: number | string,
	block: number | string,
	lot: number | string,
): string {
	return `${borough}${leftPad(block, 5)}${leftPad(lot, 4)}`;
}
