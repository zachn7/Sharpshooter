import { test, expect } from '@playwright/test';

test('smoke test: navigate through pages and fire a shot', async ({ page }) => {
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
  await page.waitForURL('**/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
  await expect(page.getByTestId('toggle-show-hud')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Start Game
  await page.getByTestId('start-button').click();
  await page.waitForURL('**/play');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('shot-count')).toBeVisible();
  await expect(page.getByTestId('back-button')).toBeVisible();

  // Verify initial shot count
  expect(await page.getByTestId('shot-count').textContent()).toContain('Shots: 3/3');

  // Get canvas and fire a shot at the center
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Click at center of canvas
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });

    // Verify shot count decreased
    await expect(page.getByTestId('shot-count')).toContainText('Shots: 2/3');
  }
});
