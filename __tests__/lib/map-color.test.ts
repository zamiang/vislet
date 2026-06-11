import { describe, expect, it } from 'vitest';

import {
	COLOR_CLASS_COUNT,
	buildColorScale,
	classifyColors,
	formatKeyValues,
} from '@/lib/map-color';

describe('buildColorScale', () => {
	it('maps the domain into 9 color classes', () => {
		const scale = buildColorScale(0, 100);
		expect(scale.range()).toHaveLength(COLOR_CLASS_COUNT);
		expect(scale(0)).toBe('color0');
		expect(scale(100)).toBe('color8');
	});
});

describe('classifyColors', () => {
	it('assigns a color class per id', () => {
		const { classes } = classifyColors(
			[
				{ id: 'A', value: 0 },
				{ id: 'B', value: 100 },
			],
			0,
			100,
		);
		expect(classes.get('A')).toBe('color0');
		expect(classes.get('B')).toBe('color8');
	});
});

describe('formatKeyValues', () => {
	it('formats sub-million values as integers with separators', () => {
		expect(formatKeyValues([1234])).toEqual([(1234).toLocaleString()]);
	});

	it('formats million+ values in millions with an m suffix', () => {
		expect(formatKeyValues([2_500_000])).toEqual([`${(2.5).toLocaleString()}m`]);
	});
});
