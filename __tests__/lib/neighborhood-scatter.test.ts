import { describe, expect, it } from 'vitest';

import { computeGrowthScatter } from '@/lib/neighborhood-scatter';
import type { BrooklynData } from '@/types';

const Y2016 = Date.UTC(2016, 0, 1);
const Y2017 = Date.UTC(2017, 0, 1);
const Y2025 = Date.UTC(2025, 0, 1);

const data = {
  ALL: { residentialPrices: [{ date: Y2016, value: 500 }], buildingClass: {} },
  // base year avg 100, latest year avg 200 → +100%
  BK0001: {
    residentialPrices: [
      { date: Y2016, value: 100 },
      { date: Y2025, value: 200 },
    ],
    buildingClass: {},
  },
  // sparse: 2 of 4 quarters has data (base + latest year present, thin coverage)
  BK0002: {
    residentialPrices: [
      { date: Y2016, value: 100 },
      { date: Y2017, value: 0 },
      { date: Date.UTC(2017, 6, 1), value: 0 },
      { date: Y2025, value: 300 },
    ],
    buildingClass: {},
  },
  // park / ignored
  BK99: {
    residentialPrices: [
      { date: Y2016, value: 100 },
      { date: Y2025, value: 100 },
    ],
    buildingClass: {},
  },
} as unknown as BrooklynData;

describe('computeGrowthScatter', () => {
  const out = computeGrowthScatter(data, {
    names: { BK0001: 'Alpha', BK0002: 'Beta-Gamma' },
    ignoredIds: ['99'],
  });

  it('excludes ALL and ignored ids', () => {
    expect(out.find((p) => p.id === 'ALL')).toBeUndefined();
    expect(out.find((p) => p.id === 'BK99')).toBeUndefined();
  });

  it('computes growth from earliest to latest yearly average', () => {
    const a = out.find((p) => p.id === 'BK0001');
    expect(a?.current).toBe(200);
    expect(a?.growth).toBeCloseTo(1.0); // +100%
  });

  it('flags neighborhoods with thin quarter coverage as sparse', () => {
    const b = out.find((p) => p.id === 'BK0002');
    expect(b?.quarters).toBe(2);
    expect(b?.totalQuarters).toBe(4);
    expect(b?.sparse).toBe(true);
    // a fully-covered neighborhood is not sparse
    expect(out.find((p) => p.id === 'BK0001')?.sparse).toBe(false);
  });

  it('falls back to the id when no display name is given', () => {
    expect(out.find((p) => p.id === 'BK0002')?.name).toBe('Beta-Gamma');
  });

  it('skips neighborhoods with fewer than two years of data', () => {
    const single = computeGrowthScatter(
      {
        BK0003: { residentialPrices: [{ date: Y2016, value: 100 }], buildingClass: {} },
      } as unknown as BrooklynData,
      { names: {} },
    );
    expect(single).toEqual([]);
  });
});
