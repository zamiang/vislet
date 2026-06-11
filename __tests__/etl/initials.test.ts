import { describe, expect, it } from 'vitest';

import { getInitials } from '../../scripts/etl/lib/initials';

describe('getInitials', () => {
  it('concatenates the first len chars of each word (multi-word)', () => {
    expect(getInitials('Rat Sighting', 3)).toBe('RatSig');
    expect(getInitials('Heat Hot Water')).toBe('HeHoWa');
  });
  it('takes len+1 chars for a single word', () => {
    expect(getInitials('Rodent', 3)).toBe('Rode');
    expect(getInitials('Noise')).toBe('Noi');
  });
});
