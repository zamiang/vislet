import { describe, expect, it } from 'vitest';

import {
  type CensusFeature,
  type RawVote,
  getDistrictData,
  tallyVotesByPrecinct,
} from '../../scripts/etl/north-carolina/aggregate';

const votes: RawVote[] = [
  { precinct_abbrv: 'P1', party_cd: 'DEM', total_voters: 60 },
  { precinct_abbrv: 'P1', party_cd: 'REP', total_voters: 40 },
];

describe('tallyVotesByPrecinct', () => {
  it('sums voters per party and total', () => {
    const t = tallyVotesByPrecinct(votes);
    expect(t.P1).toMatchObject({ DEM: 60, REP: 40, total: 100 });
  });
});

describe('getDistrictData', () => {
  const features: CensusFeature[] = [
    {
      geometry: { coordinates: [-77.6, 35.1] },
      properties: {
        district: '3',
        GEOID: '371070114003',
        prec_id: 'P1',
        B01001e1: 1127,
        B02001e2: 987,
        B15002e15: 30,
        B15002e32: 35,
      },
    },
    { geometry: {}, properties: { district: '4' } }, // no coordinates
  ];

  const out = getDistrictData(features, votes);

  it('returns undefined for features without coordinates', () => {
    expect(out[1]).toBeUndefined();
  });

  it('maps census keys, sums bachelors, and computes vote share', () => {
    const block = out[0]!;
    expect(block.district).toBe('3');
    expect(block.pop).toBe(1127);
    expect(block.white).toBe(987);
    expect(block.bachelors).toBe(65);
    expect(block.democrat).toBeCloseTo(60);
    expect(block.republican).toBeCloseTo(40);
  });
});
