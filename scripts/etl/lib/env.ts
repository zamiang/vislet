/**
 * Load a local `.env` into `process.env` for ETL scripts.
 *
 * tsx does not auto-load `.env`, so credentials like the Socrata API key live
 * there but never reach `process.env` unless we load them. We use Node's native
 * `process.loadEnvFile` (no dotenv dependency) and ignore a missing file — in CI
 * the values come from real environment secrets, not a committed `.env`.
 */
try {
  process.loadEnvFile();
} catch {
  // No local .env (e.g. CI) — env vars are already set in the environment.
}
