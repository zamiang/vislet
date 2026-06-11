/**
 * QA screenshot capture — new site (live) + legacy via Internet Archive
 * Viewport: 1440x900 @2x deviceScaleFactor
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2;

const NEW_PAGES = [
  { name: 'home',           url: 'https://www.vislet.com/' },
  { name: 'brooklyn',       url: 'https://www.vislet.com/brooklyn' },
  { name: '311',            url: 'https://www.vislet.com/311' },
  { name: 'chicago',        url: 'https://www.vislet.com/chicago' },
  { name: 'north-carolina', url: 'https://www.vislet.com/north-carolina' },
];

// Internet Archive direct snapshots (closest to 2022-06-01)
const LEGACY_PAGES = [
  { name: 'brooklyn', url: 'https://web.archive.org/web/20220601120000*/https://www.vislet.com/brooklyn' },
  { name: '311',      url: 'https://web.archive.org/web/20220601120000*/https://www.vislet.com/311' },
  { name: 'chicago',  url: 'https://web.archive.org/web/20220601120000*/https://www.vislet.com/chicago' },
  // home and north-carolina have NO Wayback snapshots — flagged unrenderable
];

const OUT_NEW    = path.join(__dirname, '../docs/qa/screenshots/new');
const OUT_LEGACY = path.join(__dirname, '../docs/qa/screenshots/legacy');

async function trySnapshot(page, name, baseUrl, outDir) {
  // Try to find a good Wayback snapshot URL
  // Pattern: /web/YYYYMMDDHHMMSS*/url gives the calendar; /web/YYYYMMDDHHMMSS/url gives the snapshot
  const snapUrl = baseUrl.replace('*/', '/');
  console.log(`  -> ${snapUrl}`);
  try {
    await page.goto(snapUrl, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(8000);
    const outPath = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`     saved: ${outPath}`);
    return true;
  } catch (err) {
    console.error(`     FAILED: ${err.message}`);
    return false;
  }
}

async function capture(page, url, outPath, waitMs = 6000) {
  console.log(`  -> ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(waitMs);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`     saved: ${outPath}`);
    return true;
  } catch (err) {
    console.error(`     FAILED: ${err.message}`);
    return false;
  }
}

const results = { new: {}, legacy: {} };

const browser = await chromium.launch({ headless: true });

// --- New site ---
console.log('\n=== NEW SITE (www.vislet.com) ===');
{
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });
  const page = await ctx.newPage();
  for (const p of NEW_PAGES) {
    results.new[p.name] = await capture(page, p.url, path.join(OUT_NEW, `${p.name}.png`));
  }
  await ctx.close();
}

// --- Legacy via Internet Archive ---
console.log('\n=== LEGACY (Internet Archive) ===');
{
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DEVICE_SCALE });
  const page = await ctx.newPage();
  for (const p of LEGACY_PAGES) {
    results.legacy[p.name] = await trySnapshot(page, p.name, p.url, OUT_LEGACY);
  }
  // Flag unavailable pages
  results.legacy.home            = null;
  results.legacy['north-carolina'] = null;
  await ctx.close();
}

await browser.close();

// Summary
console.log('\n=== SUMMARY ===');
console.log('New site:');
for (const [k, v] of Object.entries(results.new)) {
  console.log(`  ${k}: ${v ? 'OK' : 'FAILED'}`);
}
console.log('Legacy:');
for (const [k, v] of Object.entries(results.legacy)) {
  if (v === null) console.log(`  ${k}: NO SNAPSHOT — flagged unrenderable`);
  else console.log(`  ${k}: ${v ? 'OK' : 'FAILED'}`);
}
