import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testIgnore: 'production.spec.ts',
  fullyParallel: true,
  timeout: 30000,
  expect: { timeout: 7000, toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
  snapshotPathTemplate: '{testDir}/visual/{arg}{ext}',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev --workspace=@logo/playground -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
