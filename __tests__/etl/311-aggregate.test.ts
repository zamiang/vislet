import { describe, expect, it } from 'vitest';

import { type ComplaintRecord, aggregateComplaints } from '../../scripts/etl/311/aggregate';
import { monthKeyToEpoch } from '../../scripts/etl/lib/dates';

const names = { ALL: 'ALL', BK01: 'Greenpoint' };
const population: Record<string, [unknown, number]> = {
  BK01: ['Greenpoint', 2000],
};
const complaintTypes = { Noise: 'nois' };
const NOW = Date.parse('2015-01-01T00:00:00-05:00');

const complaints: ComplaintRecord[] = [
  { complaintType: 'nois', nta: 'BK01', month: 1, year: 2010, hour: 3 },
  { complaintType: 'nois', nta: 'BK01', month: 1, year: 2010, hour: 4 },
];

describe('aggregateComplaints', () => {
  const out = aggregateComplaints(complaints, complaintTypes, names, population, NOW);

  it('rate per 1000 residents (2 / (2000/1000) = 1)', () => {
    const jan = out.BK01.complaintTally.find((d) => d.date === monthKeyToEpoch('1-2010'));
    expect(jan?.value).toBe(1);
  });

  it('ALL -mean SUMS across neighborhoods (non-zero, unlike chicago)', () => {
    const jan = out.ALL['complaintTally-mean']?.find((d) => d.date === monthKeyToEpoch('1-2010'));
    // dataTotal = 2 complaints; popTotal = 2000 (only BK01 has pop) -> 2/(2000/1000)=1
    expect(jan?.value).toBe(1);
  });

  it('drops years after 2014', () => {
    const out2 = aggregateComplaints(
      [{ complaintType: 'nois', nta: 'BK01', month: 1, year: 2015, hour: 1 }],
      complaintTypes,
      names,
      population,
      NOW,
    );
    expect(out2.BK01.complaintTally.every((d) => d.value === 0)).toBe(true);
  });
});
