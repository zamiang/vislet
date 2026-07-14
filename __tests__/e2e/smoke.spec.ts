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
    await expect(page.getByRole('link', { name: 'VISLET' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    // Header nav and the featured-projects list link to the same pages, so
    // scope each assertion to its landmark to avoid strict-mode ambiguity.
    const nav = page.getByRole('navigation', { name: 'Visualizations' });
    await expect(nav.getByRole('link', { name: /NYC 311/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Chicago Crime/i })).toBeVisible();

    const projects = page.locator('.project-list');
    await expect(projects.getByRole('link', { name: /Brooklyn Property Sales/i })).toBeVisible();
    await expect(projects.getByRole('link', { name: /NYC 311/i })).toBeVisible();
    await expect(projects.getByRole('link', { name: /Chicago Crime/i })).toBeVisible();

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

test.describe('No horizontal scroll (responsive)', () => {
  // Regression guard: the map pages once used a rigid `width: 1054px` on
  // `.map-app`, which forced a horizontal scrollbar on any viewport narrower
  // than that. The layout is now fluid (max-width + wrapping row + viewBox-
  // scaled SVGs); assert the document never overflows its own viewport.
  const mapPages = ['/brooklyn', '/311', '/chicago', '/north-carolina'];
  const widths = [1280, 768, 375];

  for (const path of mapPages) {
    for (const width of widths) {
      test(`${path} does not scroll horizontally at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: 'networkidle' });
        await expect(page.locator('svg').first()).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }

  // The document-level check above can't catch content that overflows *inside*
  // a container, because `#main-layout-container { overflow-x: clip }` clips it
  // before it registers as page scroll. This guards the map SVG and the
  // choropleth color key specifically: both must stay within `.map-svg-container`
  // (i.e. actually scale down, not get silently clipped) on a narrow viewport.
  for (const path of ['/brooklyn', '/311', '/chicago']) {
    test(`${path} map + color key fit their container at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('.map-svg-container svg').first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        const container = document.querySelector('.map-svg-container');
        if (!container) return { map: null, key: null };
        const right = container.getBoundingClientRect().right;
        const svg = container.querySelector('svg');
        const key = document.querySelector('.linear-graph-key');
        return {
          map: svg ? svg.getBoundingClientRect().right - right : null,
          key: key ? key.getBoundingClientRect().right - right : null,
        };
      });

      // Allow 1px for sub-pixel rounding.
      expect(overflow.map ?? 0).toBeLessThanOrEqual(1);
      expect(overflow.key ?? 0).toBeLessThanOrEqual(1);
    });
  }
});
