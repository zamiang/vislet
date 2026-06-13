/**
 * 311 display-data build (tsx-runnable: `npm run data:build:311`).
 *
 * Modes:
 *   --backfill   (re)build the aggregate cache from scratch by streaming BOTH
 *                source datasets (2010–2019 `76ig-c548` + 2020→present
 *                `erm2-nwe9`). ~44 M rows — minutes to tens of minutes. Run
 *                locally, not in CI.
 *   (default)    incremental: load the committed cache, re-read rows from
 *                `LOOKBACK_DAYS` before cache.maxDate from `erm2-nwe9` (so rows
 *                loaded late aren't missed) and fold in any not already counted
 *                — fast enough for the monthly CI refresh.
 *
 * Both modes spatially join each record to a 2020 NTA (point-in-polygon over
 * the DCP boundaries) and then write:
 *   public/data/311/display-data.json   (the page's data)
 *   scripts/etl/311/cache/311-aggregates.json  (committed compact counts)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { naiveDateMinusDays } from '../lib/dates';
import { NtaIndex, loadNtaBoundaries } from '../lib/nta';
import { soqlPaged } from '../lib/socrata';
import { ComplaintAccumulator, LOOKBACK_DAYS, normalizeComplaintType } from './aggregate';

const HISTORICAL = '76ig-c548'; // 311 Service Requests 2010–2019 (frozen)
const CURRENT = 'erm2-nwe9'; // 311 Service Requests 2020–present (daily)
const ROOT = process.cwd();
const D = join(ROOT, 'public/data/311');
const OUT = join(D, 'display-data.json');
const META = join(D, 'meta.json');
const CACHE = join(ROOT, 'scripts/etl/311/cache/311-aggregates.json');
// Fixed reference instant for the hour-of-day axis (reproducible builds).
const HOUR_AXIS_REF = Date.parse('2025-01-01T00:00:00-05:00');

interface RawRow {
  unique_key?: string;
  created_date?: string;
  complaint_type?: string;
  latitude?: string;
  longitude?: string;
}

function ingest(acc: ComplaintAccumulator, index: NtaIndex, rows: RawRow[]): number {
  let kept = 0;
  for (const row of rows) {
    const created = row.created_date;
    if (!created || !row.complaint_type || !row.latitude || !row.longitude) continue;
    acc.observeDate(created);
    // Incremental re-reads the lookback window; skip rows already folded so the
    // overlap isn't double-counted. (Backfill starts with an empty dedup set.)
    if (row.unique_key && acc.hasSeen(row.unique_key)) continue;
    const nta = index.lookup(Number(row.longitude), Number(row.latitude));
    if (!nta) continue;
    const year = Number(created.slice(0, 4));
    const month = Number(created.slice(5, 7));
    const hour = Number(created.slice(11, 13));
    acc.add(
      nta,
      year,
      month,
      hour,
      normalizeComplaintType(row.complaint_type),
      row.unique_key,
      created,
    );
    kept++;
  }
  return kept;
}

/** First-of-month "YYYY-MM-01" strings from `startYM` up to and incl. `endYM`. */
function monthBoundaries(startYM: [number, number], endYM: [number, number]): string[] {
  const out: string[] = [];
  for (let y = startYM[0], m = startYM[1]; y < endYM[0] || (y === endYM[0] && m <= endYM[1]); ) {
    out.push(`${y}-${String(m).padStart(2, '0')}-01`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

const SELECT = 'unique_key,created_date,complaint_type,latitude,longitude';

/**
 * Stream a dataset windowed by month, with bounded concurrency. Windowing keeps
 * every `$offset` shallow (Socrata's deep-offset pagination degrades badly past
 * a few million rows), and concurrent windows hide per-request latency. The
 * accumulator is mutated synchronously inside each page callback, so concurrent
 * windows interleave safely on JS's single thread.
 */
async function streamWindowed(
  dataset: string,
  acc: ComplaintAccumulator,
  index: NtaIndex,
  start: [number, number],
  end: [number, number],
  done: Set<string>,
  checkpoint: () => void,
  concurrency = 5,
): Promise<void> {
  const bounds = monthBoundaries(start, end);
  // Window i is [bounds[i], nextMonth) — append a sentinel upper bound.
  const [ey, em] = end;
  const upper = em === 12 ? `${ey + 1}-01-01` : `${ey}-${String(em + 1).padStart(2, '0')}-01`;
  const windows = bounds
    .map((lo, i) => ({ key: `${dataset}:${lo.slice(0, 7)}`, lo, hi: bounds[i + 1] ?? upper }))
    .filter((w) => !done.has(w.key));

  let total = 0;
  let kept = 0;
  let next = 0;
  let sinceCheckpoint = 0;
  async function worker(): Promise<void> {
    while (next < windows.length) {
      const { key, lo, hi } = windows[next++];
      await soqlPaged<RawRow>(
        dataset,
        {
          $select: SELECT,
          $order: ':id',
          $where: `created_date >= '${lo}' AND created_date < '${hi}'`,
        },
        (page) => {
          total += page.length;
          kept += ingest(acc, index, page);
        },
      );
      done.add(key);
      // Checkpoint roughly every few windows so a crash loses minutes, not hours.
      if (++sinceCheckpoint >= concurrency) {
        sinceCheckpoint = 0;
        checkpoint();
      }
      console.log(`  ${dataset} ${lo.slice(0, 7)}: cumulative ${total} scanned, ${kept} geocoded`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  checkpoint();
  console.log(`  ${dataset}: ${total} scanned, ${kept} geocoded`);
}

/**
 * Incremental tail: re-read from `LOOKBACK_DAYS` *before* the watermark so rows
 * loaded late (created_date below the watermark, ingested after the last run)
 * are still picked up; `acc.hasSeen` keeps the overlap from double-counting.
 */
async function streamSince(
  dataset: string,
  acc: ComplaintAccumulator,
  index: NtaIndex,
  since: string,
): Promise<void> {
  const from = naiveDateMinusDays(since, LOOKBACK_DAYS);
  let total = 0;
  let kept = 0;
  await soqlPaged<RawRow>(
    dataset,
    { $select: SELECT, $order: ':id', $where: `created_date > '${from}'` },
    (page) => {
      total += page.length;
      kept += ingest(acc, index, page);
    },
  );
  console.log(`  ${dataset}: ${total} scanned, ${kept} folded (since ${from}, watermark ${since})`);
}

function writeCache(acc: ComplaintAccumulator): void {
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(acc.toJSON()));
}

// Resume sidecar (gitignored): the set of windows already folded into the cache,
// so a crashed backfill can be re-run and pick up where it left off.
const PROGRESS = join(ROOT, 'scripts/etl/311/cache/.backfill-progress.json');

function loadProgress(): { acc: ComplaintAccumulator; done: Set<string> } {
  if (existsSync(PROGRESS) && existsSync(CACHE)) {
    const done: string[] = JSON.parse(readFileSync(PROGRESS, 'utf8'));
    const acc = ComplaintAccumulator.fromJSON(JSON.parse(readFileSync(CACHE, 'utf8')));
    console.log(`Resuming backfill: ${done.length} windows already done.`);
    return { acc, done: new Set(done) };
  }
  return { acc: new ComplaintAccumulator(), done: new Set() };
}

function writeDisplay(acc: ComplaintAccumulator): void {
  const names = JSON.parse(readFileSync(join(D, 'nyc-neighborhood-names.json'), 'utf8'));
  const population = JSON.parse(readFileSync(join(D, 'population.json'), 'utf8'));
  const display = acc.finalize(names, population, HOUR_AXIS_REF);
  writeFileSync(OUT, JSON.stringify(display));
  // Sidecar the page copy reads to state coverage (the display series are rates,
  // so the absolute complaint count isn't recoverable from display-data.json).
  const meta = { totalComplaints: acc.totalComplaints(), maxDate: acc.maxDate };
  writeFileSync(META, JSON.stringify(meta));
  console.log(
    `Wrote ${OUT} (${Object.keys(display).length} neighborhoods, through ${acc.maxDate})`,
  );
}

async function main(): Promise<void> {
  const backfill = process.argv.includes('--backfill');
  const fromCache = process.argv.includes('--from-cache');

  // Re-finalize display JSON from the committed cache without any network I/O.
  // Use after the names/population reference changes (no need to re-pull rows).
  if (fromCache) {
    if (!existsSync(CACHE)) {
      console.error(`No aggregate cache at ${CACHE}.`);
      process.exitCode = 1;
      return;
    }
    writeDisplay(ComplaintAccumulator.fromJSON(JSON.parse(readFileSync(CACHE, 'utf8'))));
    return;
  }

  const index = new NtaIndex(await loadNtaBoundaries());

  if (backfill) {
    console.log('Backfill: streaming both 311 datasets (this takes a while)…');
    const { acc, done } = loadProgress();
    const checkpoint = (): void => {
      writeCache(acc);
      writeFileSync(PROGRESS, JSON.stringify([...done]));
    };
    const now = new Date().toISOString();
    const nowYear = Number(now.slice(0, 4));
    const nowMonth = Number(now.slice(5, 7));
    await streamWindowed(HISTORICAL, acc, index, [2010, 1], [2019, 12], done, checkpoint);
    await streamWindowed(CURRENT, acc, index, [2020, 1], [nowYear, nowMonth], done, checkpoint);
    writeCache(acc);
    writeDisplay(acc);
    rmSync(PROGRESS, { force: true }); // backfill complete — drop the resume sidecar
    return;
  }

  if (!existsSync(CACHE)) {
    console.error(
      `No aggregate cache at ${CACHE}. Run \`npm run data:build:311 -- --backfill\` once to ` +
        `build it from history, then commit it. Incremental refresh resumes from the cache.`,
    );
    process.exitCode = 1;
    return;
  }

  const acc = ComplaintAccumulator.fromJSON(JSON.parse(readFileSync(CACHE, 'utf8')));
  const since = acc.maxDate;
  console.log(`Incremental: fetching ${CURRENT} rows created after ${since}…`);
  await streamSince(CURRENT, acc, index, since);
  writeCache(acc);
  writeDisplay(acc);
}

await main();
