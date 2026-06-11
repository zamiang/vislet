import { describe, expect, it } from 'vitest';

import {
  deriveSaleDateParts,
  quarterKeyToEpoch,
  yearKeyToEpoch,
} from '../../scripts/etl/lib/dates';

describe('quarterKeyToEpoch', () => {
  it('matches the committed display-data date axis (fixed UTC-5, no DST)', () => {
    // Verified against apps/brooklyn committed brooklyn-sales-display-data.json.
    expect(quarterKeyToEpoch('1-2003')).toBe(1041397200000);
    expect(quarterKeyToEpoch('2-2003')).toBe(1049173200000);
  });

  it('Q2 is exactly +90 days from Q1 2003 (constant offset, not DST-shifted)', () => {
    expect(quarterKeyToEpoch('2-2003') - quarterKeyToEpoch('1-2003')).toBe(90 * 86400000);
  });

  it('throws on an invalid quarter', () => {
    expect(() => quarterKeyToEpoch('5-2003')).toThrow();
  });
});

describe('yearKeyToEpoch', () => {
  it('returns the start of the year at UTC-5', () => {
    expect(yearKeyToEpoch('2003')).toBe(Date.UTC(2003, 0, 1, 5));
    expect(yearKeyToEpoch(2010)).toBe(Date.UTC(2010, 0, 1, 5));
  });
});

describe('deriveSaleDateParts', () => {
  it('derives quarter/month/year for a Q1 instant', () => {
    expect(deriveSaleDateParts(quarterKeyToEpoch('1-2003'))).toEqual({
      quarter: 1,
      month: 0,
      year: 2003,
    });
  });

  it('derives Q4 for an October instant', () => {
    expect(deriveSaleDateParts(quarterKeyToEpoch('4-2014'))).toEqual({
      quarter: 4,
      month: 9,
      year: 2014,
    });
  });
});
