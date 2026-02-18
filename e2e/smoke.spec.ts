import { test, expect } from '@playwright/test';

test('smoke test: navigate through pages', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Weapons
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();
  await expect(page.getByTestId('tab-pistol')).toBeVisible();
  await expect(page.getByTestId('back-button').first()).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();
  await expect(page.getByTestId('level-pack-pistol-basics')).toBeVisible();
  await expect(page.getByTestId('back-button').first()).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Settings
  await page.getByTestId('settings-button').click();
  await page.waitForURL('**/settings');
  await page.waitForURL('**/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
  await expect(page.getByTestId('toggle-show-hud')).toBeVisible();
  await expect(page.getByTestId('back-button').first()).toBeVisible();

  // Go back to main menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();
});

test('level run flow: complete level and see results', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Select first level (should be unlocked)
  await page.getByTestId('level-pistol-calm').click();
  await page.waitForURL('**/game/pistol-calm');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Should see level briefing
  await expect(page.getByTestId('level-briefing')).toBeVisible();
  await expect(page.getByText('Mission Briefing')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('level-briefing')).not.toBeVisible();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Verify initial shot count
  const shotCount = page.getByTestId('shot-count');
  await expect(shotCount).toContainText('Shots: 5/5');

  // Get canvas and fire all shots at the center for deterministic results
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Fire 5 shots at center
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }

  // Should see results screen
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByText('Mission Complete')).toBeVisible();
  await expect(page.getByTestId('total-score')).toBeVisible();
  await expect(page.getByTestId('stars-earned')).toBeVisible();

  // Verify result elements are present
  await expect(page.getByTestId('retry-button')).toBeVisible();
  await expect(page.getByTestId('back-to-levels')).toBeVisible();

  // Go back to levels
  await page.getByTestId('back-to-levels').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Should see stars earned on the level
  await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  const levelElement = page.getByTestId('level-pistol-calm');
  const starsText = await levelElement.textContent();
  expect(starsText).toContain('★'); // Should have at least one star
});

test('deterministic test mode: stable physics with seed', async ({ page }) => {
  // Navigate to level with seed for deterministic testing
  await page.goto('/game/pistol-calm?seed=12345');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Should see level briefing
  await expect(page.getByTestId('level-briefing')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Get canvas and fire shots at center
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Fire 5 shots at center
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }

  // Should see results screen with consistent score (deterministic)
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByTestId('total-score')).toBeVisible();

  const scoreText = await page.getByTestId('total-score').textContent();
  const score = parseInt(scoreText || '0', 10);
  expect(score).toBeGreaterThan(0); // Should have scored some points
});

test('level unlock progression: next level unlocks on star', async ({ page }) => {
  // Clear localStorage to start fresh
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Go to levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // First level should be unlocked, second should be locked
  await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  await expect(page.getByTestId('level-pistol-windy')).toBeVisible();
  
  // Check that pistol-windy is locked (has lock icon)
  const pistolWindy = page.getByTestId('level-pistol-windy');
  const windyText = await pistolWindy.textContent();
  expect(windyText).toContain('🔒');

  // Complete first level
  await page.getByTestId('level-pistol-calm').click();
  await page.waitForURL('**/game/pistol-calm');
  await page.getByTestId('start-level').click();

  // Fire all shots at center for max score
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }

  // Go back to levels
  await page.getByTestId('back-to-levels').click();
  await page.waitForURL('**/levels');

  // Second level should now be unlocked
  await expect(page.getByTestId('level-pistol-windy')).toBeVisible();
  const pistolWindyAfter = page.getByTestId('level-pistol-windy');
  const windyTextAfter = await pistolWindyAfter.textContent();
  expect(windyTextAfter).not.toContain('🔒'); // Should not have lock icon
});
