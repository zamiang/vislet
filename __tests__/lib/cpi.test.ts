import { describe, expect, it } from 'vitest';

import { type CpiData, indexToBase, makeDeflator } from '@/lib/cpi';

const cpi: CpiData = {
  source: 'test',
  latest: { date: 30, value: 200 },
  series: [
    { date: 10, value: 100 },
    { date: 20, value: 150 },
    { date: 30, value: 200 },
  ],
};

describe('makeDeflator', () => {
  const deflate = makeDeflator(cpi);

  it('scales a value at the latest CPI to itself', () => {
    expect(deflate({ date: 30, value: 600 }).value).toBe(600);
  });

  it('inflates earlier dollars to constant latest dollars', () => {
    // $100 at CPI 100 → $100 * 200/100 = $200 in latest dollars.
    expect(deflate({ date: 10, value: 100 }).value).toBe(200);
  });

  it('uses the latest index point at or before the date (step lookup)', () => {
    // date 25 falls between index points 20 (150) and 30; uses 150.
    expect(deflate({ date: 25, value: 150 }).value).toBe(200);
  });

  it('clamps dates before the series start to the first index point', () => {
    expect(deflate({ date: 1, value: 100 }).value).toBe(200);
  });

  it('never divides by a zero/missing index month (no Infinity/NaN)', () => {
    // A delayed BLS release can leave a 0-valued month; the deflator must skip
    // it rather than divide by zero.
    const withGap: CpiData = {
      source: 'test',
      latest: { date: 30, value: 200 },
      series: [
        { date: 10, value: 100 },
        { date: 20, value: 0 }, // missing month
        { date: 30, value: 200 },
      ],
    };
    const d = makeDeflator(withGap);
    expect(Number.isFinite(d({ date: 20, value: 150 }).value)).toBe(true);
    expect(Number.isFinite(d({ date: 25, value: 150 }).value)).toBe(true);
  });

  it('passes values through unchanged when the series has no usable months', () => {
    const empty: CpiData = {
      source: 'test',
      latest: { date: 30, value: 0 },
      series: [{ date: 10, value: 0 }],
    };
    const d = makeDeflator(empty);
    expect(d({ date: 10, value: 123 }).value).toBe(123);
  });
});

describe('indexToBase', () => {
  it('rebases a series to 100 at its first non-zero point', () => {
    const out = indexToBase([
      { date: 1, value: 200 },
      { date: 2, value: 300 },
    ]);
    expect(out.map((p) => p.value)).toEqual([100, 150]);
  });

  it('ignores leading zeros when choosing the base', () => {
    const out = indexToBase([
      { date: 1, value: 0 },
      { date: 2, value: 400 },
      { date: 3, value: 600 },
    ]);
    expect(out.map((p) => p.value)).toEqual([0, 100, 150]);
  });

  it('returns the series unchanged when there is no non-zero base', () => {
    const pts = [{ date: 1, value: 0 }];
    expect(indexToBase(pts)).toEqual(pts);
  });
});
