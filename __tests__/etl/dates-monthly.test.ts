import { describe, expect, it } from 'vitest';

import { hourEpoch, monthKeyToEpoch } from '../../scripts/etl/lib/dates';

describe('monthKeyToEpoch', () => {
  it('matches the committed chicago/311 monthly axis (America/New_York)', () => {
    // Verified against public/data/chicago/chicago-crimes-display-data.json.
    expect(monthKeyToEpoch('1-2003')).toBe(1041397200000);
    expect(monthKeyToEpoch('2-2003')).toBe(1044075600000);
  });
  it('throws on an invalid month', () => {
    expect(() => monthKeyToEpoch('13-2003')).toThrow();
  });
});

describe('hourEpoch', () => {
  it('is deterministic for a fixed reference date (NY-local hour of that day)', () => {
    const ref = Date.parse('2015-06-15T12:00:00-04:00'); // EDT
    const noon = hourEpoch(12, ref);
    const onePm = hourEpoch(13, ref);
    expect(onePm - noon).toBe(3600000);
    // 12:00 EDT on 2015-06-15 == 16:00 UTC
    expect(new Date(noon).toISOString()).toBe('2015-06-15T16:00:00.000Z');
  });
});
