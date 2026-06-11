import { describe, expect, it } from 'vitest';

import { formatBBL, formatName, getInitials, leftPad } from '@/lib/format';

describe('getInitials', () => {
	it('takes len chars from each word of a multi-word name', () => {
		expect(getInitials('John Smith')).toBe('JoSm');
		expect(getInitials('a b c')).toBe('abc');
	});

	it('takes len+1 chars from a single-word name', () => {
		expect(getInitials('ALL')).toBe('ALL');
		expect(getInitials('Brooklyn')).toBe('Bro');
	});

	it('respects a custom length', () => {
		expect(getInitials('John Smith', 1)).toBe('JS');
		expect(getInitials('Brooklyn', 3)).toBe('Broo');
	});
});

describe('formatName', () => {
	it('replaces hyphens with comma-space', () => {
		expect(formatName('park-slope')).toBe('park, slope');
		expect(formatName('foo')).toBe('foo');
	});

	it('passes through null/undefined', () => {
		expect(formatName(null)).toBeUndefined();
		expect(formatName(undefined)).toBeUndefined();
	});
});

describe('leftPad', () => {
	it('pads with leading zeros to the target length', () => {
		expect(leftPad(23, 5)).toBe('00023');
		expect(leftPad('7', 3)).toBe('007');
	});

	it('leaves already-long values unchanged', () => {
		expect(leftPad(123456, 5)).toBe('123456');
	});
});

describe('formatBBL', () => {
	it('builds borough + 5-digit block + 4-digit lot', () => {
		expect(formatBBL(1, 23, 45)).toBe('1000230045');
		expect(formatBBL(3, 1, 1)).toBe('3000010001');
	});
});
