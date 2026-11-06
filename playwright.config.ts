import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:4200';

export default defineConfig({
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'api', testDir: './tests/api', use: { baseURL: API_URL } },
    { name: 'e2e', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'], baseURL: WEB_URL } },
  ],
});
