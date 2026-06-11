import { describe, expect, it } from 'vitest';

import { type GraphState, parseGraphState, serializeGraphState } from '@/lib/url-state';

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
