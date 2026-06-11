import { describe, expect, it } from 'vitest';

import { type AreaData, areaDomain, areaYMax, stackAreaSeries } from '@/lib/area-chart';

const data: AreaData = {
  residential: {
    t1: { date: 1, value: 0.5 },
    t2: { date: 2, value: 0.4 },
  },
  commercial: {
    t1: { date: 1, value: 0.3 },
    t2: { date: 2, value: 0.2 },
  },
  Park: {
    t1: { date: 1, value: 99 },
    t2: { date: 2, value: 99 },
  },
};

describe('areaDomain', () => {
  it('sorts names and drops ignored ids', () => {
    expect(areaDomain(data, ['Park'])).toEqual(['commercial', 'residential']);
  });
});

describe('stackAreaSeries', () => {
  it('assigns y0 baselines in domain order', () => {
    const series = stackAreaSeries(data, ['Park']);
    // commercial sorts first → baseline 0; residential stacks on top of it.
    const commercial = series.find((s) => s.name === 'commercial')!;
    const residential = series.find((s) => s.name === 'residential')!;
    expect(commercial.values.map((v) => v.y0)).toEqual([0, 0]);
    expect(residential.values.map((v) => v.y0)).toEqual([0.3, 0.2]);
    // residential's top = y0 + y
    const tops = residential.values.map((v) => v.y0 + v.y);
    expect(tops[0]).toBeCloseTo(0.8);
    expect(tops[1]).toBeCloseTo(0.6);
  });

  it('sorts each series by date', () => {
    const unsorted: AreaData = {
      a: { late: { date: 2, value: 1 }, early: { date: 1, value: 2 } },
    };
    expect(stackAreaSeries(unsorted)[0].values.map((v) => v.date)).toEqual([1, 2]);
  });
});

describe('areaYMax', () => {
  it('returns the largest stacked total across time indices', () => {
    expect(areaYMax(stackAreaSeries(data, ['Park']))).toBeCloseTo(0.8);
  });
});
