/**
 * Aggregate ETL runner (tsx-runnable: `npm run data:build`).
 *
 * Runs every app's display-data build in turn. Each step is a no-op-with-error
 * if its gitignored raw input is absent (see docs/etl.md), so this is safe to
 * run in CI as a smoke check once raws are supplied.
 *
 * As the remaining apps (311, chicago, north-carolina) are ported, import and
 * call their build steps here.
 */
import { execFileSync } from 'node:child_process';

const steps = ['scripts/etl/brooklyn/build.ts'];

let failed = false;
for (const step of steps) {
  console.log(`\n=== ${step} ===`);
  try {
    execFileSync('npx', ['tsx', step], { stdio: 'inherit' });
  } catch {
    failed = true;
  }
}

if (failed) {
  console.error('\nOne or more ETL steps failed (often: missing raw input — see docs/etl.md).');
  process.exitCode = 1;
}
