/**
 * Date helpers for the offline ETL.
 *
 * The legacy CoffeeScript used Moment, which parses/formats in the host's local
 * timezone. The committed display data was generated in **America/New_York**
 * (DST-aware): e.g. quarter-key "1-2003" -> 1041397200000 (Jan 1 2003 00:00 EST,
 * UTC-5) but "2-2013" -> Apr 1 2013 00:00 EDT (UTC-4). A naive fixed offset is
 * wrong because DST membership of Apr 1 varies by year (pre-2007 DST started in
 * April, so Apr 1 2003-2006 was still EST). We therefore convert through the
 * America/New_York zone via the Intl API (Node ships full ICU) so the output
 * matches the committed date axis exactly, on any build host.
 */

const TZ = 'America/New_York';

/** Offset (localWallClock - UTC) in ms for a given instant in the NY zone. */
function nyOffsetMs(instant: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(instant));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // Intl renders hour "24" for midnight in some engines; normalize to 0.
  const hour = map.hour === '24' ? 0 : Number(map.hour);
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - instant;
}

/** Epoch ms for a wall-clock date/time interpreted in America/New_York. */
function nyWallClockToEpoch(year: number, month0: number, day: number, hour = 0): number {
  const guess = Date.UTC(year, month0, day, hour);
  // The offset at the guessed instant is correct for Jan/Apr/Jul/Oct 1st — DST
  // transitions occur mid-March/early-November at 02:00, far from these dates.
  return guess - nyOffsetMs(guess);
}

/**
 * Convert a legacy `"<quarter>-<year>"` key (e.g. "1-2003") to epoch ms at the
 * start of that quarter (NY local midnight), matching the committed date axis.
 */
export function quarterKeyToEpoch(key: string): number {
  const [quarterStr, yearStr] = key.split('-');
  const quarter = Number(quarterStr);
  const year = Number(yearStr);
  if (!(quarter >= 1 && quarter <= 4) || !Number.isFinite(year)) {
    throw new Error(`Invalid quarter key: ${key}`);
  }
  return nyWallClockToEpoch(year, (quarter - 1) * 3, 1);
}

/**
 * Convert a legacy `"<month>-<year>"` key (e.g. "1-2010") to epoch ms at NY-local
 * midnight on the 1st of that month (311 / chicago monthly axis).
 */
export function monthKeyToEpoch(key: string): number {
  const [monthStr, yearStr] = key.split('-');
  const month = Number(monthStr);
  const year = Number(yearStr);
  if (!(month >= 1 && month <= 12) || !Number.isFinite(year)) {
    throw new Error(`Invalid month key: ${key}`);
  }
  return nyWallClockToEpoch(year, month - 1, 1);
}

/**
 * Epoch ms for "today at <hour>:00:00 NY-local", mirroring the legacy
 * `moment(new Date()).hours(h).minutes(0).seconds(0)` used for the 311/chicago
 * hour-of-day axis. This was **non-deterministic** in the legacy build (depends
 * on the run date) — `nowMs` is injectable so the output is reproducible and
 * testable. Pass a fixed reference date when regenerating.
 */
export function hourEpoch(hour: number, nowMs: number): number {
  // moment kept the local calendar day of `now`, set H:M:S. Use NY-local Y/M/D.
  const offset = nyOffsetMs(nowMs);
  const local = new Date(nowMs + offset);
  return nyWallClockToEpoch(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour);
}

/**
 * Subtract `days` from a naive `"YYYY-MM-DD…"` timestamp string, returning a
 * naive `"YYYY-MM-DDT00:00:00.000"` string in the SAME (zoneless) format the
 * Socrata `created_date` floating timestamps use. Date math is done in UTC so
 * it never depends on the host timezone; only the calendar date matters here.
 * Used to widen the incremental 311 lookback window below the cache watermark.
 */
export function naiveDateMinusDays(iso: string, days: number): string {
  const y = Number(iso.slice(0, 4));
  const mo = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  const ms = Date.UTC(y, mo - 1, d) - days * 86400000;
  const dt = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}T00:00:00.000`;
}

/** Convert a legacy `"<year>"` key (e.g. "2003") to epoch ms at NY-local start of year. */
export function yearKeyToEpoch(key: string | number): number {
  const year = Number(key);
  if (!Number.isFinite(year)) throw new Error(`Invalid year key: ${key}`);
  return nyWallClockToEpoch(year, 0, 1);
}

/**
 * Derive quarter (1-4), 0-based month, and year for a sale's epoch-ms date,
 * mirroring the legacy `Sale.setupDate` (`moment(ms).add(5, 'hours')` read in
 * NY-local time). Per-sale tz edge effects can't be validated without the
 * (absent) raw sales; the quarterly aggregation axis is validated separately.
 */
export function deriveSaleDateParts(epochMs: number): {
  quarter: number;
  month: number;
  year: number;
} {
  const shifted = Math.floor(epochMs) + 5 * 3600 * 1000;
  const offset = nyOffsetMs(shifted);
  const local = new Date(shifted + offset);
  const month = local.getUTCMonth();
  return {
    quarter: Math.floor(month / 3) + 1,
    month,
    year: local.getUTCFullYear(),
  };
}
