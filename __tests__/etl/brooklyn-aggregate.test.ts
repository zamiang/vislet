import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { aggregateSales, normalizeSale } from '../../scripts/etl/brooklyn/aggregate';
import { quarterKeyToEpoch } from '../../scripts/etl/lib/dates';

const DATA_DIR = join(process.cwd(), 'public/data/brooklyn');
const ntaCodes = Object.keys(
  JSON.parse(readFileSync(join(DATA_DIR, 'nyc-neighborhood-names.json'), 'utf8')),
);
const buildingClassKeys = Object.keys(
  JSON.parse(readFileSync(join(DATA_DIR, 'building-class.json'), 'utf8')),
);

describe('normalizeSale', () => {
  it('derives quarter/year and pricePerSqFt, trims building class', () => {
    const s = normalizeSale({
      buildingCl: '01  ONE FAMILY DWELLINGS',
      residentia: 1,
      commercial: 0,
      ntacode: 'BK27',
      price: '$400,000',
      grossSqFt: '1,000',
      date: quarterKeyToEpoch('1-2003'),
    });
    expect(s.buildingClass).toBe('01  ONE FAMILY DWELLINGS');
    expect(s.quarter).toBe(1);
    expect(s.year).toBe(2003);
    expect(s.pricePerSqFt).toBe(400);
  });

  it('excludes pricePerSqFt for implausible sqft/price (legacy rules)', () => {
    expect(
      normalizeSale({ price: '$5,000', grossSqFt: '1,000', date: 0 }).pricePerSqFt,
    ).toBeUndefined();
    expect(
      normalizeSale({ price: '$400,000', grossSqFt: '100', date: 0 }).pricePerSqFt,
    ).toBeUndefined();
  });
});

describe('aggregateSales', () => {
  const out = aggregateSales(
    [
      {
        buildingCl: '01 ONE FAMILY',
        residentia: 1,
        commercial: 0,
        ntacode: 'BK27',
        price: '$400,000',
        grossSqFt: '1,000',
        date: quarterKeyToEpoch('1-2003'),
      },
      {
        buildingCl: '01 ONE FAMILY',
        residentia: 1,
        commercial: 0,
        ntacode: 'BK27',
        price: '$600,000',
        grossSqFt: '1,000',
        date: quarterKeyToEpoch('1-2003'),
      },
    ],
    ntaCodes,
    buildingClassKeys,
  );

  it('produces a 48-point quarterly axis (2003-2014) per NTA', () => {
    expect(out.BK27.residentialPrices).toHaveLength(48);
  });

  it('means pricePerSqFt within a quarter (mean(400,600)=500)', () => {
    const q1 = out.BK27.residentialPrices.find((d) => d.date === quarterKeyToEpoch('1-2003'));
    expect(q1?.value).toBe(500);
  });

  it('emits the special ALL (-mean) and BK73 (williamsburgTrend) series', () => {
    expect(out.ALL['residentialPrices-mean']).toBeDefined();
    expect(out.BK73.williamsburgTrend).toBeDefined();
    expect(out.BK27.williamsburgTrend).toBeUndefined();
  });

  it('matches the committed display-data date axis exactly', () => {
    const committed = JSON.parse(
      readFileSync(join(DATA_DIR, 'brooklyn-sales-display-data.json'), 'utf8'),
    );
    const expectedDates = committed.ALL.residentialPrices.map((d: { date: number }) => d.date);
    const actualDates = out.ALL.residentialPrices.map((d) => d.date);
    expect(actualDates).toEqual(expectedDates);
  });
});
