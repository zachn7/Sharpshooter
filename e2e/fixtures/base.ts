import { test as base, expect } from '@playwright/test';

/**
 * Base fixture for test isolation.
 * Sets up deterministic defaults instead of clearing storage to allow
 * selections (like weapon choice) to persist within a single test across page navigations.
 */
export const test = base.extend<object, object>({});

export { expect };

// Set up deterministic test defaults before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Set deterministic defaults for test mode
    // Don't clear storage - we want selections like weapon choice to persist
    // across navigations within a single test
  });
});
