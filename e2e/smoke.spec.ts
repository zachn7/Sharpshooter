import { test, expect } from '@playwright/test';

test('smoke test: navigate through all pages', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Weapons
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();
  await expect(page.getByTestId('tab-pistols')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();
  await expect(page.getByTestId('level-pack-pistol-basics')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Settings
  await page.getByTestId('settings-button').click();
  await page.waitForURL('**/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
  await expect(page.getByTestId('toggle-show-hud')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Start Game
  await page.getByTestId('start-button').click();
  await page.waitForURL('**/play');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();
});
