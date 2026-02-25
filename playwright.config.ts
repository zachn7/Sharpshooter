import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use specified workers env var (default to 2 in CI for speed, or use detected CPU count)
  workers: process.env.PWTEST_WORKERS ? parseInt(process.env.PWTEST_WORKERS) : (process.env.CI ? 2 : undefined),
  reporter: 'html',
  // Global timeout for each test
   timeout: 30 * 1000, // 30 seconds per test
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Capture screenshots only on failure
    screenshot: 'only-on-failure',
    // Capture video only on failure in CI
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Force test mode for determinism
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes startup timeout
  },
});
