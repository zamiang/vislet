import { expect, test } from '@playwright/test';

// Collect console errors during a page visit
function collectErrors(page: import('@playwright/test').Page): () => string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Error|error/.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return () => errors;
}

test.describe('Home page (/)', () => {
  test('loads and contains navigation links and header', async ({ page }) => {
    const getErrors = collectErrors(page);
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    expect(response?.status()).toBe(200);
    await expect(page.getByText('VISLET')).toBeVisible();
    await expect(page.getByRole('link', { name: /Brooklyn Property Sales/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /NYC 311/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chicago Crime/i })).toBeVisible();

    expect(getErrors()).toHaveLength(0);
  });
});

test.describe('Brooklyn page (/brooklyn)', () => {
  test('loads and renders an SVG', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/brooklyn', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?area=BK60 loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/brooklyn?area=BK60', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?date=1041397200000 loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/brooklyn?date=1041397200000', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });
});

test.describe('311 page (/311)', () => {
  test('loads and renders an SVG', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/311', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?area=BK50 loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/311?area=BK50', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?type=HEAT loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/311?type=HEAT', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });
});

test.describe('Chicago page (/chicago)', () => {
  test('loads and renders an SVG', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/chicago', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?area=2 loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/chicago?area=2', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?type=ASS loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/chicago?type=ASS', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });
});

test.describe('North Carolina page (/north-carolina)', () => {
  test('loads and renders an SVG', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/north-carolina', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?area=official-2012 loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/north-carolina?area=official-2012', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('?area=splitline loads without error', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/north-carolina?area=splitline', { waitUntil: 'networkidle' });

    await expect(page.locator('svg').first()).toBeVisible();
    expect(getErrors()).toHaveLength(0);
  });

  test('census-tract circles render as SVG circle elements', async ({ page }) => {
    const getErrors = collectErrors(page);
    await page.goto('/north-carolina', { waitUntil: 'networkidle' });

    // The overlay renders hundreds of <circle> elements inside the choropleth SVG
    const circles = page.locator('svg circle');
    await expect(circles.first()).toBeVisible();
    const count = await circles.count();
    expect(count).toBeGreaterThan(100);
    expect(getErrors()).toHaveLength(0);
  });
});
