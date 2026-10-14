import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    extraHTTPHeaders: {
      'Accept': 'application/json, text/plain, */*',
    },
  },
  webServer: {
    command: 'node node_modules/next/dist/bin/next start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'api-security',
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
