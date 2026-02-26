import { test as base, expect } from '@playwright/test';

/**
 * Base fixture that clears storage before each test to ensure test isolation.
 * Prevents settings leakage between tests when running in parallel.
 */
export const test = base.extend<object, object>({
  clearStorage: [async (_ctx, use) => {
    // This runs before each test
    await use();
  }],
});

export { expect };

// Clear localStorage and sessionStorage before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Clear all storage to prevent settings drift
    localStorage.clear();
    sessionStorage.clear();
  });
});
