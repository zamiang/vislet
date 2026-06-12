import { describe, expect, it } from 'vitest';

import { getYearTickCount, snapToNearest } from '@/lib/slider';

const Y = (year: number) => Date.UTC(year, 0, 1);
const dates = [Y(2010), Y(2011), Y(2012), Y(2013)];

describe('snapToNearest', () => {
  it('snaps to the closer date', () => {
    expect(snapToNearest(dates, Y(2010) + 1000)).toBe(Y(2010));
    expect(snapToNearest(dates, Y(2012) - 1000)).toBe(Y(2012));
  });

  it('clamps below/above the range', () => {
    expect(snapToNearest(dates, Y(2000))).toBe(Y(2010));
    expect(snapToNearest(dates, Y(2030))).toBe(Y(2013));
  });

  it('returns the input for an empty list', () => {
    expect(snapToNearest([], 123)).toBe(123);
  });
});

describe('getYearTickCount', () => {
  it('returns ~1 tick per year of span by default (readable labels)', () => {
    expect(getYearTickCount(dates)).toBe(3); // 2013 - 2010 = 3 years * 1
    expect(getYearTickCount(dates, 2)).toBe(6);
  });

  it('floors at 2 ticks so short spans still render an axis', () => {
    expect(getYearTickCount([Y(2012), Y(2013)])).toBe(2); // 1-year span -> max(1, 2)
  });

  it('returns 0 for empty input', () => {
    expect(getYearTickCount([])).toBe(0);
  });
});
