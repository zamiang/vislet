import { describe, expect, it } from 'vitest';

import { formatBBL, leftPad } from '../../scripts/etl/lib/bbl';

describe('leftPad', () => {
  it('zero-pads to the target length', () => {
    expect(leftPad(63, 5)).toBe('00063');
    expect(leftPad('119', 4)).toBe('0119');
  });
  it('leaves values already at/over length unchanged', () => {
    expect(leftPad(12345, 5)).toBe('12345');
    expect(leftPad(123456, 5)).toBe('123456');
  });
});

describe('formatBBL', () => {
  it('builds a 10-char borough+block+lot key', () => {
    // borough 3 (Brooklyn), block 6363, lot 119 -> 3 06363 0119
    expect(formatBBL(3, 6363, 119)).toBe('3063630119');
  });
});
