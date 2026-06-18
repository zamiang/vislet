import { describe, expect, it } from 'vitest';

import {
  type LineGraphData,
  getFlattenedData,
  getLines,
  lineColor,
  yDomain,
} from '@/lib/line-chart';

const data: LineGraphData = {
  ALL: {
    'price-mean': [
      { date: 1, value: 10 },
      { date: 2, value: 20 },
    ],
  },
  'park-slope': {
    price: [
      { date: 1, value: 5 },
      { date: 2, value: 15 },
    ],
  },
};

describe('getFlattenedData', () => {
  it('pulls -mean keys from ALL and other keys from the active dataset', () => {
    const flat = getFlattenedData(data, ['price', 'price-mean'], 'park-slope');
    expect(flat).toEqual({
      price: data['park-slope'].price,
      'price-mean': data['ALL']['price-mean'],
    });
  });

  it('also routes -median keys to ALL (borough aggregate)', () => {
    const med: LineGraphData = {
      ALL: { 'price-median': [{ date: 1, value: 99 }] },
      'park-slope': { price: [{ date: 1, value: 5 }] },
    };
    const flat = getFlattenedData(med, ['price', 'price-median'], 'park-slope');
    expect(flat['price-median']).toEqual(med['ALL']['price-median']);
    expect(flat['price']).toEqual(med['park-slope'].price);
  });

  it('skips keys missing from the data', () => {
    expect(getFlattenedData(data, ['missing'], 'park-slope')).toEqual({});
  });
});

describe('getLines', () => {
  it('labels -mean series as Borough Average and others with the dataset id', () => {
    const flat = getFlattenedData(data, ['price', 'price-mean'], 'park-slope');
    const lines = getLines(flat, 'park-slope');
    expect(lines.find((l) => l.name === 'price')?.id).toBe('park-slope');
    expect(lines.find((l) => l.name === 'price-mean')?.id).toBe('Borough Average');
  });

  it('appends an empty compare-dataset series by default', () => {
    const lines = getLines({ price: data['park-slope'].price }, 'park-slope');
    const compare = lines.find((l) => l.name === 'compare-dataset');
    expect(compare?.values).toEqual([]);
  });

  it('fills the compare series when a compare dataset is provided', () => {
    const lines = getLines({ price: data['park-slope'].price }, 'park-slope', {
      compareDataset: 'ALL',
      compareData: { price: data['ALL']['price-mean'] },
      keys: ['price'],
    });
    const compare = lines.find((l) => l.name === 'compare-dataset');
    expect(compare?.id).toBe('ALL');
    expect(compare?.values).toEqual(data['ALL']['price-mean']);
  });
});

describe('lineColor', () => {
  it('maps mean / median / compare / default series to their colors', () => {
    expect(lineColor('price-mean')).toBe('lightgray');
    expect(lineColor('price-median')).toBe('lightgray');
    expect(lineColor('compare-dataset')).toBe('#D53F50');
    expect(lineColor('park-slope')).toBe('#5a7684'); // Steel Blue (--primary)
  });

  it('gives inflation-adjusted (-real) series a warm counterpart color', () => {
    expect(lineColor('residentialPrices-real')).toBe('#c2703d'); // neighborhood real
    expect(lineColor('residentialPrices-median-real')).toBe('#e0b196'); // borough real
    // nominal keys are unaffected
    expect(lineColor('residentialPrices')).toBe('#5a7684');
    expect(lineColor('residentialPrices-median')).toBe('lightgray');
  });
});

describe('getLines -median labeling', () => {
  it('labels -median series as Borough Median', () => {
    const med: LineGraphData = { ALL: { 'price-median': [{ date: 1, value: 99 }] } };
    const flat = getFlattenedData(med, ['price-median'], 'park-slope');
    expect(getLines(flat, 'park-slope').find((l) => l.name === 'price-median')?.id).toBe(
      'Borough Median',
    );
  });
});

describe('yDomain', () => {
  it('spans the min and max value across all series', () => {
    const flat = getFlattenedData(data, ['price', 'price-mean'], 'park-slope');
    expect(yDomain(getLines(flat, 'park-slope'))).toEqual([5, 20]);
  });

  it('falls back to [0, 0] for empty input', () => {
    expect(yDomain([])).toEqual([0, 0]);
  });
});
