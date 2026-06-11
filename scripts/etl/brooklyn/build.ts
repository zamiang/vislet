/**
 * Brooklyn display-data build step (tsx-runnable: `npm run data:build:brooklyn`).
 *
 * Reads the raw geocoded sales GeoJSON, runs the typed aggregation, and writes
 * `public/data/brooklyn/brooklyn-sales-display-data.json`.
 *
 * NOTE: the raw input (`apps/brooklyn/data/brooklyn-sales.json`) is gitignored
 * and is NOT present in this tree — see docs/etl.md. This script will report a
 * clear error until the raw dataset is supplied. The aggregation logic itself
 * is unit-tested against the committed output's date axis.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type RawSaleProperties, aggregateSales } from './aggregate';

const ROOT = process.cwd();
const RAW_INPUT = join(ROOT, 'apps/brooklyn/data/brooklyn-sales.json');
const OUT = join(ROOT, 'public/data/brooklyn/brooklyn-sales-display-data.json');
const NAMES = join(ROOT, 'public/data/brooklyn/nyc-neighborhood-names.json');
const CLASSES = join(ROOT, 'public/data/brooklyn/building-class.json');

function main(): void {
  if (!existsSync(RAW_INPUT)) {
    console.error(
      `Raw input not found: ${RAW_INPUT}\n` +
        `It is gitignored and not committed. Supply the geocoded sales GeoJSON ` +
        `(see docs/etl.md) before running this build.`,
    );
    process.exitCode = 1;
    return;
  }

  const geo = JSON.parse(readFileSync(RAW_INPUT, 'utf8')) as {
    features: { properties: RawSaleProperties }[];
  };
  const sales = geo.features.map((f) => f.properties);
  const ntaCodes = Object.keys(JSON.parse(readFileSync(NAMES, 'utf8')));
  const buildingClassKeys = Object.keys(JSON.parse(readFileSync(CLASSES, 'utf8')));

  const display = aggregateSales(sales, ntaCodes, buildingClassKeys);
  writeFileSync(OUT, JSON.stringify(display));
  console.log(
    `Wrote ${OUT} (${sales.length} sales -> ${Object.keys(display).length} neighborhoods)`,
  );
}

main();
