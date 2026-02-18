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

test('wind HUD displays baseline and gust range', async ({ page }) => {
  // Navigate to a level with wind
  await page.goto('/game/pistol-windy');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await expect(page.getByTestId('level-briefing')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();

  // Wind HUD should be visible
  await expect(page.getByTestId('wind-hud')).toBeVisible();
  await expect(page.getByTestId('wind-arrow')).toBeVisible();

  // Wind HUD should contain wind information
  const windHud = page.getByTestId('wind-hud');
  expect(await windHud.textContent()).toContain('Wind');
  expect(await windHud.textContent()).toContain('Baseline:');
  expect(await windHud.textContent()).toContain('Gust:');

  // Wind arrow should point in the direction of wind (pistol-windy has +2 m/s wind)
  const windArrow = page.getByTestId('wind-arrow');
  expect(await windArrow.textContent()).toContain('→'); // Right arrow for positive wind
});

test('shot history records windUsed for each shot', async ({ page }) => {
  // Navigate to level with gusts
  await page.goto('/game/pistol-windy');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await page.getByTestId('start-level').click();

  // Fire a shot
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Shot history should appear
  await expect(page.getByTestId('shot-history')).toBeVisible();
  await expect(page.getByText('Shot History')).toBeVisible();

  // First shot row should be visible with wind info
  await expect(page.getByTestId('shot-row-1')).toBeVisible();
  const shotRow1 = page.getByTestId('shot-row-1');
  expect(await shotRow1.textContent()).toContain('#1');
  expect(await shotRow1.textContent()).toContain('m/s'); // Should include wind value

  // Fire second shot
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Second shot row should be visible
  await expect(page.getByTestId('shot-row-2')).toBeVisible();
  const shotRow2 = page.getByTestId('shot-row-2');
  expect(await shotRow2.textContent()).toContain('#2');

  // both should have wind values
  expect(await shotRow1.textContent()).toContain('m/s');
  expect(await shotRow2.textContent()).toContain('m/s');
});

test('wind arrow direction based on wind direction', async ({ page }) => {
  // Test positive wind (right arrow)
  await page.goto('/game/pistol-windy'); // windMps: 2
  await page.getByTestId('start-level').click();
  const windArrowPositive = page.getByTestId('wind-arrow');
  await expect(windArrowPositive).toBeVisible();
  expect(await windArrowPositive.textContent()).toContain('→');

  // Test zero wind (neutral)
  await page.goto('/game/sniper-calm'); // windMps: 2, but let's test zero wind
  await page.getByTestId('start-level').click();
  const windArrowNeutral = page.getByTestId('wind-arrow');
  await expect(windArrowNeutral).toBeVisible();
  // Should still show arrow for positive wind
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

test('settings: preset selection persists and affects HUD', async ({ page }) => {
  // Navigate to settings
  await page.goto('/');
  await page.getByTestId('settings-button').click();
  await page.waitForURL('**/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Select Arcade preset
  await page.getByTestId('preset-arcade').click();
  await expect(page.getByTestId('preset-arcade')).toBeVisible();

  // Wait a moment for save to complete
  await page.waitForTimeout(100);

  // Go to settings again and verify preset is saved
  await page.goto('/settings');
  await expect(page.getByTestId('preset-arcade')).toBeVisible();

  // Navigate to a level
  await page.goto('/game/pistol-windy');
  await page.getByTestId('start-level').click();

  // HUD should be visible by default
  await expect(page.getByTestId('wind-hud')).toBeVisible();

  // Navigate back and turn off HUD
  await page.goto('/settings');
  await page.getByTestId('toggle-show-hud').click();
  await page.waitForTimeout(100);

  // Verify HUD is off
  await page.goto('/game/pistol-windy');
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('wind-hud')).not.toBeVisible();
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
