/**
 * North Carolina display-data build (tsx-runnable). Joins census-block features
 * with the voter tally and writes the flat per-block display JSON.
 *
 * Raw inputs (census-block-by-district.json + vote-tally.json) are
 * gitignored/absent (issue #15) — exits with a clear error until supplied.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type CensusFeature, type RawVote, getDistrictData } from './aggregate';

const ROOT = process.cwd();
const D = join(ROOT, 'apps/north-carolina/data');
const CENSUS = join(D, 'census-block-by-district.json');
const VOTES = join(D, 'vote-tally.json');
const OUT = join(ROOT, 'public/data/north-carolina/display-data.json');

function main(): void {
  if (!existsSync(CENSUS) || !existsSync(VOTES)) {
    console.error(
      `Raw inputs not found under ${D}\nGitignored/absent — see docs/etl.md (issue #15).`,
    );
    process.exitCode = 1;
    return;
  }
  const features = JSON.parse(readFileSync(CENSUS, 'utf8')).features as CensusFeature[];
  const rawVotes = JSON.parse(readFileSync(VOTES, 'utf8')) as RawVote[];
  const display = getDistrictData(features, rawVotes);
  writeFileSync(OUT, JSON.stringify(display));
  console.log(`Wrote ${OUT} (${display.length} blocks)`);
}

main();
