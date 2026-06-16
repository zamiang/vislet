/**
 * CPI-U reference series (tsx-runnable: `npm run data:cpi`).
 *
 * Fetches the US CPI-U "all items, US city average, not seasonally adjusted"
 * index (BLS series `CUUR0000SA0`) and writes `public/data/cpi-us.json`. The
 * Brooklyn page uses this to plot inflation-adjusted ("real") $/sqft alongside
 * the nominal series: real(date) = nominal * latestCpi / cpi(date).
 *
 * The BLS public API serves up to 10 years per request without a key, which
 * covers the Brooklyn sales window (2016→present). The committed JSON is the
 * source of truth; re-run this only to extend the range.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SERIES = 'CUUR0000SA0';
const START_YEAR = 2016;
const OUT = join(process.cwd(), 'public/data/cpi-us.json');

const MONTHS: Record<string, number> = {
  M01: 0,
  M02: 1,
  M03: 2,
  M04: 3,
  M05: 4,
  M06: 5,
  M07: 6,
  M08: 7,
  M09: 8,
  M10: 9,
  M11: 10,
  M12: 11,
};

interface BlsPoint {
  year: string;
  period: string; // "M01".."M12"
  value: string;
}

async function main(): Promise<void> {
  const endYear = new Date().getUTCFullYear();
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: [SERIES],
      startyear: String(START_YEAR),
      endyear: String(endYear),
    }),
  });
  const json = (await res.json()) as {
    status: string;
    Results: { series: { data: BlsPoint[] }[] };
  };
  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS request failed: ${json.status}`);
  }

  const series = json.Results.series[0].data
    .filter((d) => d.period in MONTHS)
    .map((d) => ({
      date: Date.UTC(Number(d.year), MONTHS[d.period], 1),
      value: Number(d.value),
    }))
    // Drop months BLS has not yet published (a delayed release returns the row
    // with a null value → NaN here); a zero/NaN index would divide-by-zero in
    // the deflator.
    .filter((d) => Number.isFinite(d.value) && d.value > 0)
    .sort((a, b) => a.date - b.date);

  const latest = series[series.length - 1];
  const out = {
    source: `BLS CPI-U, US city average, all items, NSA (${SERIES})`,
    latest,
    series,
  };
  writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `Wrote ${OUT} (${series.length} monthly points ${START_YEAR}–${endYear}, latest ${latest.value})`,
  );
}

await main();
