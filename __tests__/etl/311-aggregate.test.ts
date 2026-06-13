import { describe, expect, it } from 'vitest';

import {
  ComplaintAccumulator,
  type ComplaintRecord,
  aggregateComplaints,
  normalizeComplaintType,
} from '../../scripts/etl/311/aggregate';
import { monthKeyToEpoch } from '../../scripts/etl/lib/dates';

const names = { ALL: 'ALL', BK0101: 'Greenpoint' };
const population: Record<string, [unknown, number]> = {
  BK0101: ['Greenpoint', 2000],
};
const complaintTypes = { Noise: 'nois' };
const NOW = Date.parse('2015-01-01T00:00:00-05:00');

const complaints: ComplaintRecord[] = [
  { complaintType: 'nois', nta: 'BK0101', month: 1, year: 2010, hour: 3 },
  { complaintType: 'nois', nta: 'BK0101', month: 1, year: 2010, hour: 4 },
];

describe('normalizeComplaintType', () => {
  it('folds renamed/merged categories to a stable code', () => {
    expect(normalizeComplaintType('Heat/Hot Water')).toBe('heat');
    expect(normalizeComplaintType('HEATING')).toBe('heat');
    expect(normalizeComplaintType('Damaged Tree')).toBe('deatre');
    expect(normalizeComplaintType('Overgrown Tree/Branches')).toBe('deatre');
    expect(normalizeComplaintType('Noise - Commercial')).toBe('nois');
    expect(normalizeComplaintType('Noise - Street/Sidewalk')).toBe('nois');
  });
});

describe('aggregateComplaints', () => {
  const out = aggregateComplaints(complaints, complaintTypes, names, population, NOW);

  it('rate per 1000 residents (2 / (2000/1000) = 1)', () => {
    const jan = out.BK0101.complaintTally.find((d) => d.date === monthKeyToEpoch('1-2010'));
    expect(jan?.value).toBe(1);
  });

  it('ALL -mean sums across neighborhoods', () => {
    const jan = out.ALL['complaintTally-mean']?.find((d) => d.date === monthKeyToEpoch('1-2010'));
    expect(jan?.value).toBe(1);
  });

  it('drops records whose NTA is not in the name set', () => {
    const out2 = aggregateComplaints(
      [{ complaintType: 'nois', nta: 'QN9999', month: 1, year: 2010, hour: 1 }],
      complaintTypes,
      names,
      population,
      NOW,
    );
    expect(out2.BK0101.complaintTally.every((d) => d.value === 0)).toBe(true);
  });
});

describe('ComplaintAccumulator', () => {
  it('builds a contiguous monthly axis spanning min..max month', () => {
    const acc = new ComplaintAccumulator();
    acc.add('BK0101', 2010, 1, 3, 'nois');
    acc.add('BK0101', 2010, 6, 4, 'nois'); // gap Feb–May should still appear
    const out = acc.finalize(names, population, NOW);
    expect(out.BK0101.complaintTally).toHaveLength(6);
    expect(out.BK0101.complaintTally[0].date).toBe(monthKeyToEpoch('1-2010'));
    expect(out.BK0101.complaintTally[5].date).toBe(monthKeyToEpoch('6-2010'));
    // The gap months are present and zero.
    expect(out.BK0101.complaintTally[2].value).toBe(0);
  });

  it('round-trips through the cache JSON', () => {
    const acc = new ComplaintAccumulator();
    acc.observeDate('2021-05-01T00:00:00.000');
    acc.add('BK0101', 2021, 5, 10, 'heat');
    const restored = ComplaintAccumulator.fromJSON(JSON.parse(JSON.stringify(acc.toJSON())));
    expect(restored.maxDate).toBe('2021-05-01T00:00:00.000');
    const out = restored.finalize(names, population, NOW);
    expect(out.BK0101.complaintType.heat[10].value).toBeGreaterThan(0);
  });

  it('keeps observed maxDate for incremental resume', () => {
    const acc = new ComplaintAccumulator();
    acc.observeDate('2020-01-01T00:00:00.000');
    acc.observeDate('2026-03-15T12:00:00.000');
    acc.observeDate('2024-01-01T00:00:00.000');
    expect(acc.maxDate).toBe('2026-03-15T12:00:00.000');
  });
});
