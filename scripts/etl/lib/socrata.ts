/**
 * Minimal Socrata SODA 2.1 client for the NYC Open Data refresh pipeline.
 *
 * No SDK dependency — just paginated `fetch` against
 * `https://data.cityofnewyork.us/resource/<dataset>.json` with SoQL params.
 * Anonymous access is rate-limited per IP; set `SOCRATA_APP_TOKEN` (free token,
 * https://data.cityofnewyork.us/profile/app_tokens) to raise the limit. CI
 * provides it as a repo secret (see .github/workflows/data-refresh.yml).
 */

const BASE = 'https://data.cityofnewyork.us/resource';
const MAX_RETRIES = 8;
const MAX_BACKOFF_MS = 20000;
const REQUEST_TIMEOUT_MS = 120000;

export type SoqlParams = Record<string, string | number>;

function buildUrl(dataset: string, params: SoqlParams): string {
  const url = new URL(`${BASE}/${dataset}.json`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.toString();
}

async function fetchWithRetry(url: string): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = process.env.SOCRATA_APP_TOKEN;
  if (token) headers['X-App-Token'] = token;

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Fail a hung connection fast (so it retries) rather than stalling until
      // the OS read timeout — important over a long, many-thousand-request job.
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`Socrata ${res.status} for ${url}`);
      }
      if (!res.ok) {
        // 4xx other than 429 is a query bug — no point retrying.
        throw Object.assign(new Error(`Socrata ${res.status} for ${url}: ${await res.text()}`), {
          fatal: true,
        });
      }
      return await res.json();
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal) throw err;
      lastError = err;
      const backoff = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

/** Run a single SoQL query (e.g. an aggregation) and return the rows. */
export async function soqlQuery<T>(dataset: string, params: SoqlParams): Promise<T[]> {
  return (await fetchWithRetry(buildUrl(dataset, params))) as T[];
}

/**
 * Stream every row matching `params`, paging with `$limit`/`$offset`, invoking
 * `onPage` per page. `params` must NOT include `$limit`/`$offset`; pass a
 * stable `$order` for deterministic pagination.
 */
export async function soqlPaged<T>(
  dataset: string,
  params: SoqlParams,
  onPage: (rows: T[], offset: number) => void | Promise<void>,
  pageSize = 50000,
): Promise<number> {
  let offset = 0;
  for (;;) {
    const rows = await soqlQuery<T>(dataset, { ...params, $limit: pageSize, $offset: offset });
    if (rows.length > 0) await onPage(rows, offset);
    offset += rows.length;
    if (rows.length < pageSize) return offset;
  }
}
