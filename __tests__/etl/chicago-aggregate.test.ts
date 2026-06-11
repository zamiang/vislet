import { describe, expect, it } from 'vitest';

import { type CrimeRecord, aggregateCrimes } from '../../scripts/etl/chicago/aggregate';
import { monthKeyToEpoch } from '../../scripts/etl/lib/dates';

const names = { ALL: 'ALL', '1': 'Loop' };
const population = { Loop: { 'TOTAL-2010': 1000 } };
const crimeTypes = { THEFT: 'THE' };
const NOW = Date.parse('2015-01-01T00:00:00-05:00');

const crimes: CrimeRecord[] = [
  { crimeType: 'THE', nta: '1', month: 1, year: 2003, hour: 5 },
  { crimeType: 'THE', nta: '1', month: 1, year: 2003, hour: 6 },
  { crimeType: 'THE', nta: '1', month: 1, year: 2003, hour: 7 },
];

describe('aggregateCrimes', () => {
  const out = aggregateCrimes(crimes, crimeTypes, names, population, NOW);

  it('rate = count per 1000 residents (3 crimes / (1000/1000) = 3)', () => {
    const jan = out['1'].crimeTally.find((d) => d.date === monthKeyToEpoch('1-2003'));
    expect(jan?.value).toBe(3);
  });

  it('drops out-of-range years', () => {
    const out2 = aggregateCrimes(
      [{ crimeType: 'THE', nta: '1', month: 1, year: 2020, hour: 1 }],
      crimeTypes,
      names,
      population,
      NOW,
    );
    expect(out2['1'].crimeTally.every((d) => d.value === 0)).toBe(true);
  });

  it('reproduces the legacy all-zero ALL series (scalar _.reduce quirk)', () => {
    expect(out.ALL.crimeTally.every((d) => d.value === 0)).toBe(true);
    expect(out.ALL['crimeTally-mean']?.every((d) => d.value === 0)).toBe(true);
  });

  it('emits a 24-point hour-of-day series per valid crime type', () => {
    expect(out['1'].crimeType.THE).toHaveLength(24);
  });
});
