import { describe, expect, it } from 'vitest';

import { type RawSale, geocodeSales } from '../../scripts/etl/brooklyn/geocode';

describe('geocodeSales', () => {
  const bblToLatLong = { '3063630119': [40.6, -73.9] as [number, number] };
  const blockLotToBbl = { '6363-119': '3063630119' };

  it('attaches coordinates via block-lot -> bbl -> lat/long and emits a FeatureCollection', () => {
    const sales: RawSale[] = [
      {
        BLOCK: 6363,
        LOT: 119,
        'BUILDING CLASS CATEGORY': ' 01 ONE FAMILY ',
        'SALE PRICE': '$670,000',
        'SALE DATE': '2014-04-16',
      },
    ];
    const { collection, stats } = geocodeSales(sales, bblToLatLong, blockLotToBbl);
    expect(stats).toMatchObject({ total: 1, success: 1, fail: 0 });
    expect(collection.features).toHaveLength(1);
    const f = collection.features[0];
    expect(f.properties.bbl).toBe('3063630119');
    expect(f.properties.buildingClass).toBe('01 ONE FAMILY');
    // geometry is [y, x] = [long, lat] per the legacy code
    expect(f.geometry.coordinates).toEqual([-73.9, 40.6]);
  });

  it('drops sales that do not resolve to coordinates', () => {
    const sales: RawSale[] = [{ BLOCK: 9999, LOT: 1, 'SALE DATE': '2014-01-01' }];
    const { collection, stats } = geocodeSales(sales, bblToLatLong, blockLotToBbl);
    expect(stats.fail).toBe(1);
    expect(collection.features).toHaveLength(0);
  });
});
