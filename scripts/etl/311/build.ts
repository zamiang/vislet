/**
 * 311 display-data build (tsx-runnable). Reads the line-delimited GeoJSON-ish
 * 311 export, parses to complaint records, aggregates, writes the display JSON.
 *
 * Raw input (apps/311/data/311-by-neighborhood.json) is gitignored/absent
 * (issue #15) — exits with a clear error until supplied. Parsing mirrors the
 * legacy line reader (apps/311/format-data.coffee).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { getInitials } from '../lib/initials';
import { type ComplaintRecord, aggregateComplaints } from './aggregate';

const ROOT = process.cwd();
const RAW = join(ROOT, 'apps/311/data/311-by-neighborhood.json');
const D = join(ROOT, 'public/data/311');
const OUT = join(D, 'display-data.json');

function normalizeInitials(raw: string): string {
  let i = getInitials(raw, 3).toLowerCase();
  if (i === 'heawat') i = 'heat';
  if (i === 'damtre' || i === 'ovetre') i = 'deatre';
  if (i === 'miscol(almat') i = 'miscol';
  if (i === 'noi-con' || i === 'noi-str') i = 'nois';
  return i;
}

function main(): void {
  if (!existsSync(RAW)) {
    console.error(`Raw input not found: ${RAW}\nGitignored/absent — see docs/etl.md (issue #15).`);
    process.exitCode = 1;
    return;
  }
  const lines = readFileSync(RAW, 'utf8').split('\n');
  const records: ComplaintRecord[] = [];
  for (const line of lines) {
    if (line.length <= 1) continue;
    const json = JSON.parse(line.replace('} },', '} }')).properties;
    const d = new Date(json['Created Da']);
    const year = d.getFullYear();
    if (year > 2009 && year < 2015) {
      records.push({
        complaintType: normalizeInitials(json['Complaint']),
        nta: json.ntacode,
        month: d.getMonth() + 1,
        year,
        hour: d.getHours(),
      });
    }
  }
  const complaintTypes = JSON.parse(readFileSync(join(D, 'complaint-types.json'), 'utf8'));
  const names = JSON.parse(readFileSync(join(D, 'nyc-neighborhood-names.json'), 'utf8'));
  const population = JSON.parse(readFileSync(join(D, 'population.json'), 'utf8'));
  const display = aggregateComplaints(
    records,
    complaintTypes,
    names,
    population,
    Date.parse('2015-01-01T00:00:00-05:00'),
  );
  writeFileSync(OUT, JSON.stringify(display));
  console.log(`Wrote ${OUT} (${records.length} complaints)`);
}

main();
