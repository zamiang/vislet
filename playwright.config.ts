import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Astro 7 auto-detects AI coding agents and runs `astro dev` as a detached
    // background process, which makes Playwright's webServer see the command
    // exit early. Force the server to stay in the foreground so Playwright can
    // manage its lifecycle. See ASTRO_DEV_BACKGROUND in the Astro 7 CLI docs.
    env: { ASTRO_DEV_BACKGROUND: '0' },
  },
});
