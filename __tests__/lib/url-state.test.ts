import { describe, expect, it } from 'vitest';

import { NTA_2010_TO_2020 } from '@/lib/nta-crosswalk';
import {
  type GraphState,
  parseGraphState,
  resolveAreaCode,
  serializeGraphState,
} from '@/lib/url-state';

describe('parseGraphState', () => {
  it('decodes the empty query as overview', () => {
    expect(parseGraphState('')).toEqual({ kind: 'overview' });
    expect(parseGraphState('?')).toEqual({ kind: 'overview' });
  });

  it('decodes area, with optional hover', () => {
    expect(parseGraphState('?area=BK01')).toEqual({ kind: 'area', area: 'BK01' });
    expect(parseGraphState('area=BK01&hover=BK02')).toEqual({
      kind: 'area',
      area: 'BK01',
      hover: 'BK02',
    });
  });

  it('decodes type and date', () => {
    expect(parseGraphState('?type=01_ONE_FAMILY')).toEqual({ kind: 'type', type: '01_ONE_FAMILY' });
    expect(parseGraphState('?date=1388534400000')).toEqual({ kind: 'date', date: 1388534400000 });
  });

  it('decodes the north-carolina map-type variants (legacy deep-link parity)', () => {
    for (const type of ['official-2012', 'splitline', 'brian']) {
      expect(parseGraphState(`?type=${type}`)).toEqual({ kind: 'type', type });
      expect(serializeGraphState({ kind: 'type', type })).toBe(`type=${type}`);
    }
  });

  it('honors legacy precedence area > type > date', () => {
    expect(parseGraphState('?area=BK01&type=foo&date=123')).toEqual({
      kind: 'area',
      area: 'BK01',
    });
    expect(parseGraphState('?type=foo&date=123')).toEqual({ kind: 'type', type: 'foo' });
  });

  it('ignores a non-numeric date', () => {
    expect(parseGraphState('?date=nope')).toEqual({ kind: 'overview' });
  });

  it('accepts a URLSearchParams instance', () => {
    expect(parseGraphState(new URLSearchParams({ area: 'BK01' }))).toEqual({
      kind: 'area',
      area: 'BK01',
    });
  });

  it('resolves legacy 2010 NTA codes in area/hover to 2020 codes', () => {
    // BK73 (2010 Williamsburg) → BK0102 (2020) per the generated crosswalk.
    expect(NTA_2010_TO_2020.BK73).toBe('BK0102');
    expect(parseGraphState('?area=BK73')).toEqual({ kind: 'area', area: 'BK0102' });
    expect(parseGraphState('?area=BK73&hover=BK60')).toEqual({
      kind: 'area',
      area: NTA_2010_TO_2020.BK73,
      hover: NTA_2010_TO_2020.BK60,
    });
  });

  it('passes current 2020 codes through unchanged', () => {
    expect(parseGraphState('?area=BK0102')).toEqual({ kind: 'area', area: 'BK0102' });
  });
});

describe('resolveAreaCode', () => {
  it('maps known legacy codes and passes others through', () => {
    expect(resolveAreaCode('BK73')).toBe(NTA_2010_TO_2020.BK73);
    expect(resolveAreaCode('BK0102')).toBe('BK0102'); // already 2020
    expect(resolveAreaCode('ALL')).toBe('ALL');
  });
});

describe('serializeGraphState', () => {
  const cases: GraphState[] = [
    { kind: 'overview' },
    { kind: 'area', area: 'BK01' },
    { kind: 'area', area: 'BK01', hover: 'BK02' },
    { kind: 'type', type: '01_ONE_FAMILY' },
    { kind: 'date', date: 1388534400000 },
  ];

  it('round-trips with parseGraphState', () => {
    for (const state of cases) {
      expect(parseGraphState(serializeGraphState(state))).toEqual(state);
    }
  });

  it('serializes overview to the empty string', () => {
    expect(serializeGraphState({ kind: 'overview' })).toBe('');
  });
});
