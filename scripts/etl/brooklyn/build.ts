/**
 * Brooklyn display-data build (tsx-runnable: `npm run data:build:brooklyn`).
 *
 * Fetches Brooklyn rows from the NYC DOF "Citywide Annualized Calendar Sales
 * Update" dataset (NYC Open Data `w2pb-icbu`, updated annually, coverage
 * 2016→present) and writes `public/data/brooklyn/brooklyn-sales-display-data.json`.
 *
 * The dataset natively carries each lot's 2020 NTA code and coordinates, so
 * the legacy geocoding pipeline (bbl-to-lat-long.json et al.) is gone. The
 * full Brooklyn pull is ~280 K rows / a few minutes — small enough to refetch
 * completely on every run (the source only changes once a year).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { soqlPaged, soqlQuery } from '../lib/socrata';
import { type SaleRow, aggregateSales } from './aggregate';

const DATASET = 'w2pb-icbu';
const START_YEAR = 2016; // dataset coverage starts 2016-01-01
const ROOT = process.cwd();
const D = join(ROOT, 'public/data/brooklyn');
const OUT = join(D, 'brooklyn-sales-display-data.json');

const FIELDS = [
  'nta',
  'sale_date',
  'sale_price',
  'gross_square_feet',
  'residential_units',
  'commercial_units',
  'building_class_category',
];

async function main(): Promise<void> {
  const [{ max_date: maxDate }] = await soqlQuery<{ max_date: string }>(DATASET, {
    $select: 'max(sale_date) as max_date',
    $where: "borough='3'",
  });
  const endYear = Number(maxDate.slice(0, 4));
  const years = Array.from({ length: endYear - START_YEAR + 1 }, (_, i) => START_YEAR + i);

  const rows: SaleRow[] = [];
  const fetched = await soqlPaged<SaleRow>(
    DATASET,
    {
      $select: FIELDS.join(','),
      $where: `borough='3' AND sale_date >= '${START_YEAR}-01-01'`,
      $order: ':id',
    },
    (page) => {
      rows.push(...page);
      console.log(`  fetched ${rows.length} sales…`);
    },
  );

  const ntaCodes = Object.keys(
    JSON.parse(readFileSync(join(D, 'nyc-neighborhood-names.json'), 'utf8')),
  );
  const buildingClassKeys = Object.keys(
    JSON.parse(readFileSync(join(D, 'building-class.json'), 'utf8')),
  );

  const display = aggregateSales(rows, ntaCodes, buildingClassKeys, years);
  writeFileSync(OUT, JSON.stringify(display));
  console.log(
    `Wrote ${OUT} (${fetched} sales ${START_YEAR}–${endYear} -> ` +
      `${Object.keys(display).length} neighborhoods)`,
  );
}

await main();
