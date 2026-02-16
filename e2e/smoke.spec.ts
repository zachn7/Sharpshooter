import { test, expect } from '@playwright/test';

test('smoke test: home page loads', async ({ page }) => {
  await page.goto('/');

  const heading = page.getByTestId('app-title');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Vite + React');
});
