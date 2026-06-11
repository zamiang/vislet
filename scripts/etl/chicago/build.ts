/**
 * Chicago display-data build (tsx-runnable). Reads the raw crimes CSV, parses
 * it to crime records, aggregates, and writes the display JSON.
 *
 * Raw input (apps/chicago/data/crimes.csv) is gitignored/absent (issue #15) —
 * exits with a clear error until supplied. CSV parsing mirrors the legacy
 * line-by-line reader (apps/chicago/format-data.coffee).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { getInitials } from '../lib/initials';
import { type CrimeRecord, aggregateCrimes } from './aggregate';

const ROOT = process.cwd();
const RAW = join(ROOT, 'apps/chicago/data/crimes.csv');
const D = join(ROOT, 'public/data/chicago');
const OUT = join(D, 'chicago-crimes-display-data.json');

function parseDate(s: string): { month: number; year: number; hour: number } {
  // "MM/DD/YYYY hh:mm:SS A"
  const [datePart, timePart, ampm] = s.split(' ');
  const [mm, , yyyy] = datePart.split('/').map(Number);
  let hour = timePart ? Number(timePart.split(':')[0]) : 0;
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { month: mm, year: yyyy, hour };
}

function main(): void {
  if (!existsSync(RAW)) {
    console.error(`Raw input not found: ${RAW}\nGitignored/absent — see docs/etl.md (issue #15).`);
    process.exitCode = 1;
    return;
  }
  const lines = readFileSync(RAW, 'utf8').split('\n');
  const records: CrimeRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cols = lines[i].split(',');
    const { month, year, hour } = parseDate(cols[2]);
    records.push({ crimeType: getInitials(cols[5], 2), nta: cols[13], month, year, hour });
  }
  const crimeTypes = JSON.parse(readFileSync(join(D, 'crime-types.json'), 'utf8'));
  const names = JSON.parse(readFileSync(join(D, 'neighborhood-names.json'), 'utf8'));
  const population = JSON.parse(readFileSync(join(D, 'chicago-population-2000-2010.json'), 'utf8'));
  const display = aggregateCrimes(
    records,
    crimeTypes,
    names,
    population,
    Date.parse('2015-01-01T00:00:00-05:00'),
  );
  writeFileSync(OUT, JSON.stringify(display));
  console.log(`Wrote ${OUT} (${records.length} crimes)`);
}

main();
