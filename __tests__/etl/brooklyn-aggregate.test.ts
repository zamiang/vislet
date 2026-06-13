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
const YEARS = [2016, 2017];

describe('normalizeSale', () => {
  it('derives quarter/year and pricePerSqFt from API strings', () => {
    const s = normalizeSale({
      building_class_category: '01 ONE FAMILY DWELLINGS',
      residential_units: '1',
      commercial_units: '0',
      nta: 'BK0101',
      sale_price: '400000',
      gross_square_feet: '1,000',
      sale_date: '2016-02-15T00:00:00.000',
    });
    expect(s?.buildingClass).toBe('01');
    expect(s?.quarter).toBe(1);
    expect(s?.year).toBe(2016);
    expect(s?.pricePerSqFt).toBe(400);
  });

  it('returns null without a parseable sale date', () => {
    expect(normalizeSale({ sale_price: '400000' })).toBeNull();
  });

  it('excludes pricePerSqFt for implausible sqft/price (legacy rules)', () => {
    const base = { nta: 'BK0101', sale_date: '2016-02-15T00:00:00.000' };
    expect(
      normalizeSale({ ...base, sale_price: '5000', gross_square_feet: '1,000' })?.pricePerSqFt,
    ).toBeUndefined();
    expect(
      normalizeSale({ ...base, sale_price: '400000', gross_square_feet: '100' })?.pricePerSqFt,
    ).toBeUndefined();
    // $10/sqft is below the $30 sanity floor (nominal-consideration transfer).
    expect(
      normalizeSale({ ...base, sale_price: '10000', gross_square_feet: '1,000' })?.pricePerSqFt,
    ).toBeUndefined();
  });
});

describe('aggregateSales', () => {
  const out = aggregateSales(
    [
      {
        building_class_category: '01 ONE FAMILY DWELLINGS',
        residential_units: '1',
        commercial_units: '0',
        nta: 'BK0101',
        sale_price: '400000',
        gross_square_feet: '1,000',
        sale_date: '2016-02-15T00:00:00.000',
      },
      {
        building_class_category: '01 ONE FAMILY DWELLINGS',
        residential_units: '1',
        commercial_units: '0',
        nta: 'BK0101',
        sale_price: '600000',
        gross_square_feet: '1,000',
        sale_date: '2016-03-20T00:00:00.000',
      },
      // commercial-unit sale: counted for building class, not for prices
      {
        building_class_category: '05 TAX CLASS 1 VACANT LAND',
        residential_units: '1',
        commercial_units: '1',
        nta: 'BK0101',
        sale_price: '900000',
        gross_square_feet: '1,000',
        sale_date: '2016-01-05T00:00:00.000',
      },
      // outside-borough/park NTA: ignored entirely
      {
        building_class_category: '01 ONE FAMILY DWELLINGS',
        residential_units: '1',
        commercial_units: '0',
        nta: 'QN0101',
        sale_price: '500000',
        gross_square_feet: '1,000',
        sale_date: '2016-02-01T00:00:00.000',
      },
    ],
    ntaCodes,
    buildingClassKeys,
    YEARS,
  );

  it('produces a quarterly axis covering the requested years per NTA', () => {
    expect(out.BK0101.residentialPrices).toHaveLength(YEARS.length * 4);
  });

  it('means residential pricePerSqFt within a quarter, excluding commercial', () => {
    // The $900/sqft commercial-unit sale would shift the mean if counted.
    const q1 = out.BK0101.residentialPrices.find((d) => d.date === quarterKeyToEpoch('1-2016'));
    expect(q1?.value).toBe(500);
  });

  it('emits the ALL (-mean) series only on ALL', () => {
    expect(out.ALL['residentialPrices-mean']).toBeDefined();
    expect(out.BK0101['residentialPrices-mean']).toBeUndefined();
  });

  it('ignores sales in NTAs outside the lookup (parks, other boroughs)', () => {
    expect(out.QN0101).toBeUndefined();
  });

  it('matches the committed display-data date axis', () => {
    const committed = JSON.parse(
      readFileSync(join(DATA_DIR, 'brooklyn-sales-display-data.json'), 'utf8'),
    ) as Record<string, { residentialPrices: { date: number }[] }>;
    const committedDates = committed.ALL.residentialPrices.map((d) => d.date);
    expect(committedDates[0]).toBe(quarterKeyToEpoch('1-2016'));
    expect(new Set(committedDates).size).toBe(committedDates.length);
  });
});
