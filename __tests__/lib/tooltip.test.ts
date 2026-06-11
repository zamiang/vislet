import { describe, expect, it } from 'vitest';

import { findNearestPoint, formatOutput } from '@/lib/tooltip';
import type { DataPoint } from '@/types';

const points: DataPoint[] = [
	{ date: 0, value: 1 },
	{ date: 100, value: 2 },
	{ date: 200, value: 3 },
];

describe('findNearestPoint', () => {
	it('returns the closer of the two neighbors', () => {
		expect(findNearestPoint(points, 40)?.date).toBe(0);
		expect(findNearestPoint(points, 60)?.date).toBe(100);
		expect(findNearestPoint(points, 170)?.date).toBe(200);
		// exact tie picks the lower neighbor (legacy uses `>`, not `>=`)
		expect(findNearestPoint(points, 150)?.date).toBe(100);
	});

	it('clamps to the ends and handles empty input', () => {
		expect(findNearestPoint(points, -50)?.date).toBe(0);
		expect(findNearestPoint(points, 9999)?.date).toBe(200);
		expect(findNearestPoint([], 5)).toBeUndefined();
	});
});

describe('formatOutput', () => {
	it('formats large values as integers with separators', () => {
		expect(formatOutput(12345.6)).toBe((12346).toLocaleString());
	});

	it('formats mid values with two decimals', () => {
		expect(formatOutput(12.345)).toBe((12.35).toLocaleString());
	});

	it('formats fractions as percent with the suffix', () => {
		expect(formatOutput(0.1234)).toBe('12.34 %');
		expect(formatOutput(0.1234, '%')).toBe('12.34%');
	});

	it('returns null for zero and negatives', () => {
		expect(formatOutput(0)).toBeNull();
		expect(formatOutput(-5)).toBeNull();
	});
});
