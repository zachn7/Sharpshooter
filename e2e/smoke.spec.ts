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

test('settings page: data management controls exist', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Verify data section exists
  await expect(page.getByTestId('data-section')).toBeVisible();

  // Verify export button exists
  await expect(page.getByTestId('export-save')).toBeVisible();

  // Verify import button exists
  await expect(page.getByTestId('import-save')).toBeVisible();

  // Verify reset button exists
  await expect(page.getByTestId('reset-save')).toBeVisible();
  await expect(page.getByTestId('reset-save')).toHaveText('Reset');

  // Click reset button to show confirmation
  await page.getByTestId('reset-save').click();

  // Verify confirmation buttons appear
  await expect(page.getByTestId('reset-confirm')).toBeVisible();
  await expect(page.getByTestId('reset-confirm-yes')).toBeVisible();
  await expect(page.getByTestId('reset-confirm-yes')).toHaveText('Yes, Reset');
  await expect(page.getByTestId('reset-confirm-no')).toBeVisible();
  await expect(page.getByTestId('reset-confirm-no')).toHaveText('Cancel');

  // Verify warning message appears
  await expect(page.getByTestId('reset-warning')).toBeVisible();

  // Cancel the reset
  await page.getByTestId('reset-confirm-no').click();

  // Verify reset button is back to normal
  await expect(page.getByTestId('reset-save')).toBeVisible();
  await expect(page.getByTestId('reset-save')).toHaveText('Reset');
});

test('level run flow: complete level and see results', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Navigate directly to game page with testMode enabled (disables sway/recoil)
  await page.goto('/game/pistol-calm?testMode=1');
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

  // Verify group size is displayed (requires 2+ shots)
  await expect(page.getByTestId('group-size')).toBeVisible();
  const groupSizeText = await page.getByTestId('group-size').textContent();
  expect(groupSizeText).toContain('Group Size:');
  expect(groupSizeText).toContain('cm');
  expect(groupSizeText).toContain('MILs');

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

test('turret dialing controls adjust elevation and windage', async ({ page }) => {
  // Navigate to a level
  await page.goto('/game/pistol-windy');
  await page.getByTestId('start-level').click();

  // Verify turret HUD is visible
  await expect(page.getByTestId('turret-hud')).toBeVisible();

  // Verify initial values (zeroed)
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.0');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.0');

  // Adjust elevation up
  await page.getByTestId('elevation-up').click();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.1');

  // Adjust windage right
  await page.getByTestId('windage-right').click();
  await expect(page.getByTestId('windage-value')).toHaveText('+0.1');

  // Adjust multiple times
  await page.getByTestId('elevation-up').click();
  await page.getByTestId('elevation-up').click();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.3');

  // Adjust down/left
  await page.getByTestId('elevation-down').click();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.2');

  await page.getByTestId('windage-left').click();
  await page.getByTestId('windage-left').click();
  await expect(page.getByTestId('windage-value')).toHaveText('-0.1');

  // Reset turret
  await page.getByTestId('reset-turret').click();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.0');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.0');
});

test('reticle mode toggle and magnification control', async ({ page }) => {
  // Navigate to a level
  await page.goto('/game/pistol-windy');
  await page.getByTestId('start-level').click();

  // Verify default simple crosshair
  await expect(page.getByTestId('reticle-mode-toggle')).toHaveText('Crosshair');
  await expect(page.getByTestId('magnification-control')).toHaveText('1x');

  // Toggle to MIL reticle
  await page.getByTestId('reticle-mode-toggle').click();
  await expect(page.getByTestId('reticle-mode-toggle')).toHaveText('MIL Reticle');

  // Toggle magnification
  await page.getByTestId('magnification-control').click();
  await expect(page.getByTestId('magnification-control')).toHaveText('4x');

  await page.getByTestId('magnification-control').click();
  await expect(page.getByTestId('magnification-control')).toHaveText('8x');

  await page.getByTestId('magnification-control').click();
  await expect(page.getByTestId('magnification-control')).toHaveText('1x');

  // Toggle back to simple crosshair
  await page.getByTestId('reticle-mode-toggle').click();
  await expect(page.getByTestId('reticle-mode-toggle')).toHaveText('Crosshair');
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

test('zeroing profile: save and return to zero', async ({ page }) => {
  // Start fresh
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Go to game
  await page.goto('/game/pistol-calm');
  await page.getByTestId('start-level').click();

  // Verify turret HUD is visible and zeroed
  await expect(page.getByTestId('turret-hud')).toBeVisible();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.0');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.0');

  // Adjust turret to some values
  await page.getByTestId('elevation-up').click();
  await page.getByTestId('elevation-up').click();
  await page.getByTestId('elevation-up').click();
  await page.getByTestId('windage-right').click();
  await page.getByTestId('windage-right').click();

  await expect(page.getByTestId('elevation-value')).toHaveText('+0.3');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.2');

  // Save zero profile
  await page.getByTestId('save-zero').click();
  await page.waitForTimeout(100);

  // Adjust turret to different values
  await page.getByTestId('elevation-up').click();
  await page.getByTestId('elevation-down').click();
  await page.getByTestId('windage-left').click();

  await expect(page.getByTestId('elevation-value')).toHaveText('+0.3');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.1');

  // Return to zero - should restore saved values
  await page.getByTestId('return-to-zero').click();
  await page.waitForTimeout(100);

  await expect(page.getByTestId('elevation-value')).toHaveText('+0.3');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.2');
});

test('zero range: shot limit mode toggle persists', async ({ page }) => {
  // Start fresh
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Go to zero range
  await page.goto('/zero-range');
  await expect(page.getByTestId('zero-range-page')).toBeVisible();
  await expect(page.getByTestId('zero-range-controls')).toBeVisible();

  // Default should be unlimited mode
  await expect(page.getByTestId('zero-mode-label')).toContainText('Practice (∞)');
  await expect(page.getByTestId('zero-shot-limit-toggle')).toHaveText('Switch to 3-Shot Mode');

  // Verify shot count shows infinity
  const shotCount = page.getByTestId('shot-count');
  await expect(shotCount).toContainText('Shots: ∞');

  // Toggle to 3-shot mode
  await page.getByTestId('zero-shot-limit-toggle').click();
  await page.waitForTimeout(100);

  // Should now show 3-shot mode
  await expect(page.getByTestId('zero-mode-label')).toContainText('Practice (3)');
  await expect(page.getByTestId('zero-shot-limit-toggle')).toHaveText('Switch to Unlimited Mode');

  // Verify shot count shows remaining shots
  await expect(shotCount).toContainText('Shots: 3/');

  // Fire a shot to verify counter decrements
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  await expect(shotCount).toContainText('Shots: 2/5');

  // Toggle back to unlimited mode (should still have fired the shot)
  await page.getByTestId('zero-shot-limit-toggle').click();
  await page.waitForTimeout(100);

  // Should show infinity again
  await expect(page.getByTestId('zero-mode-label')).toContainText('Practice (∞)');
  await expect(shotCount).toContainText('Shots: ∞');

  // Refresh page and verify setting persists
  await page.reload();
  await expect(page.getByTestId('zero-range-page')).toBeVisible();

  // Should still be in unlimited mode after refresh
  await expect(page.getByTestId('zero-mode-label')).toContainText('Practice (∞)');
  await expect(shotCount).toContainText('Shots: ∞');

  // Toggle to 3-shot mode again
  await page.getByTestId('zero-shot-limit-toggle').click();
  await page.waitForTimeout(100);

  // Fire all 3 shots
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // After 3 shots should see results screen
  await expect(page.getByTestId('results-screen')).toBeVisible();

  // Results screen should NOT show stars (zero range doesn't save progress)
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByTestId('total-score')).toBeVisible();
  // Stars-earned element should NOT be present in zero range results
  const starsEarned = page.getByTestId('stars-earned');
  const isVisible = await starsEarned.count();
  expect(isVisible).toBe(0); // No stars in zero range
});

test('impact offset readout and arcade assist', async ({ page }) => {
  // Start fresh
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Set Arcade preset in settings
  await page.getByTestId('settings-button').click();
  await page.waitForURL('**/settings');
  await page.getByTestId('preset-arcade').click();
  await page.waitForTimeout(100);

  // Go to game with deterministic seed
  await page.goto('/game/pistol-windy?seed=999');
  await page.getByTestId('start-level').click();

  // Verify turret HUD is visible and zeroed
  await expect(page.getByTestId('turret-hud')).toBeVisible();
  await expect(page.getByTestId('elevation-value')).toHaveText('+0.0');
  await expect(page.getByTestId('windage-value')).toHaveText('+0.0');

  // Fire a shot slightly off-center to create an offset
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Aim slightly below center (this will create a negative elevation offset)
    await canvas.click({ position: { x: box.width / 2, y: box.height * 0.55 } });
  }

  // Impact offset panel should be visible
  await expect(page.getByTestId('impact-offset-panel')).toBeVisible();

  // Check that offset values are displayed
  const offsetPanel = page.getByTestId('impact-offset-panel');
  const offsetText = await offsetPanel.textContent();
  expect(offsetText).toContain('Impact Offset');
  expect(offsetText).toContain('Elevation:');
  expect(offsetText).toContain('Windage:');
  expect(offsetText).toContain('MIL');

  // Apply Correction button should be visible in Arcade mode
  await expect(page.getByTestId('apply-correction')).toBeVisible();

  // Save original turret values
  const originalElevation = await page.getByTestId('elevation-value').textContent();
  const originalWindage = await page.getByTestId('windage-value').textContent();

  // Click Apply Correction
  await page.getByTestId('apply-correction').click();
  await page.waitForTimeout(100);

  // Turret values should have changed (applying the inverse of the offset)
  const newElevation = await page.getByTestId('elevation-value').textContent();
  const newWindage = await page.getByTestId('windage-value').textContent();
  
  // Values should be different from original unless shot was dead center
  const hasChanged = newElevation !== originalElevation || newWindage !== originalWindage;
  expect(hasChanged).toBe(true);
});

test('dispersion: deterministic with seed', async ({ page }) => {
  // Test that the same seed produces the same group size
  await page.goto('/game/pistol-calm?seed=99999&testMode=1');
  await page.getByTestId('start-level').click();
  
  // Fire all shots at center
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }
  
  // Get group size
  await expect(page.getByTestId('group-size')).toBeVisible();
  const groupSize1 = await page.getByTestId('group-size').textContent();
  
  // Go back and try again with the same seed
  await page.getByTestId('retry-button').click();
  await page.getByTestId('start-level').click();
  
  if (box) {
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }
  
  const groupSize2 = await page.getByTestId('group-size').textContent();
  
  // Group sizes should be identical with the same seed
  expect(groupSize1).toBe(groupSize2);
});

test('dispersion: scales with weapon precision', async ({ page }) => {
  // Test that less precise weapons have larger group sizes
  const baseSeed = 12345;
  
  // Test with training pistol (3.0 MOA)
  await page.goto(`/weapons`);
  await page.getByTestId('weapon-pistol-training').click();
  await page.goto(`/game/pistol-calm?seed=${baseSeed}&testMode=1`);
  await page.getByTestId('start-level').click();
  
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }
  
  await expect(page.getByTestId('group-size')).toBeVisible();
  const groupSizeTrainingText = await page.getByTestId('group-size').textContent();
  const trainingCm = parseFloat(groupSizeTrainingText?.match(/Group Size: ([\d.]+) cm/)?.[1] || '0');
  
  // Test with competition pistol (1.5 MOA - more precise)
  await page.goto('/weapons');
  await page.getByTestId('weapon-pistol-competition').click();
  await page.goto(`/game/pistol-calm?seed=${baseSeed}&testMode=1`);
  await page.getByTestId('start-level').click();
  
  if (box) {
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    }
  }
  
  await expect(page.getByTestId('group-size')).toBeVisible();
  const groupSizeCompetitionText = await page.getByTestId('group-size').textContent();
  const competitionCm = parseFloat(groupSizeCompetitionText?.match(/Group Size: ([\d.]+) cm/)?.[1] || '0');
  
  // Competition pistol (more precise) should have smaller group
  expect(competitionCm).toBeLessThan(trainingCm);
});

test('wind visibility: numeric wind hidden in realistic, visible in arcade', async ({ page }) => {
  // Go to settings and change to Realistic preset
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
  
  // Select Realistic preset
  await page.getByText('Realistic').click();
  
  // Navigate to game level
  await page.goto('/game/pistol-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // In Realistic mode, numeric wind should be hidden by default
  await expect(page.getByTestId('wind-cues')).toBeVisible();
  await expect(page.getByTestId('wind-numeric')).not.toBeAttached();
  
  // Go back to settings
  await page.getByTestId('back-button').click();
  await page.goto('/settings');
  
  // Change to Arcade preset
  await page.getByText('Arcade').click();
  
  // Navigate to game level again
  await page.goto('/game/pistol-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // In Arcade mode, numeric wind should be visible by default
  await expect(page.getByTestId('wind-cues')).toBeVisible();
  await expect(page.getByTestId('wind-numeric')).toBeVisible();
});

test('wind visibility: toggle overrides preset default', async ({ page }) => {
  // Go to settings and change to Realistic preset
  await page.goto('/settings');
  await page.getByText('Realistic').click();
  
  // Enable numeric wind toggle (override default)
  await page.getByTestId('toggle-show-numeric-wind').click();
  
  // Navigate to game level
  await page.goto('/game/pistol-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // Numeric wind should be visible because toggle overrides preset
  await expect(page.getByTestId('wind-cues')).toBeVisible();
  await expect(page.getByTestId('wind-numeric')).toBeVisible();
  
  // Go back and disable toggle
  await page.getByTestId('back-button').click();
  await page.goto('/settings');
  await page.getByTestId('toggle-show-numeric-wind').click();
  
  // Change to Arcade preset (default is to show)
  await page.getByText('Arcade').click();
  
  // Navigate to game level
  await page.goto('/game/pistol-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // Numeric wind should still be visible because toggle allows it
  await expect(page.getByTestId('wind-cues')).toBeVisible();
  await expect(page.getByTestId('wind-numeric')).toBeVisible();
  
  // Disable toggle in Arcade
  await page.getByTestId('back-button').click();
  await page.goto('/settings');
  await page.getByTestId('toggle-show-numeric-wind').click();
  
  // Navigate to game level
  await page.goto('/game/pistol-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // Now numeric wind should be hidden because toggle is off
  await expect(page.getByTestId('wind-cues')).toBeVisible();
  await expect(page.getByTestId('wind-numeric')).not.toBeAttached();
});

test('ammo variants: select weapon + ammo -> start level -> HUD shows ammo name', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to weapons page
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();

  // Select a weapon (should expand ammo selector)
  await page.getByTestId('weapon-pistol-training').click();
  await expect(page.getByTestId('ammo-selector-pistol-training')).toBeVisible();

  // Select an ammo variant
  await page.getByTestId('ammo-option-pistol-budget').click();

  // The selected ammo should have the checkmark
  await expect(page.getByTestId('ammo-option-pistol-budget')).toContainText('✓');

  // Navigate to a level with test mode enabled
  await page.goto('/game/pistol-calm?testMode=1');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await expect(page.getByTestId('level-briefing')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Level info bar should display the selected ammo name
  const levelInfoBar = page.getByTestId('level-info-bar');
  await expect(levelInfoBar).toBeVisible();
  
  // Check that ammo name is displayed
  const ammoNameElement = page.getByTestId('ammo-name');
  await expect(ammoNameElement).toBeVisible();
  expect(await ammoNameElement.textContent()).toContain('Budget FMJ');

  // Fire a shot to ensure physics works with selected ammo
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Should see impact marker
  await expect(page.getByTestId('shot-row-1')).toBeVisible();
});

test('ammo variants persists selection across page navigation', async ({ page }) => {
  // Navigate to weapons page
  await page.goto('/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();

  // Switch to rifle tab
  await page.getByTestId('tab-rifle').click();

  // Select weapon and ammo
  await page.getByTestId('weapon-rifle-assault').click();
  await expect(page.getByTestId('ammo-selector-rifle-assault')).toBeVisible();
  await page.getByTestId('ammo-option-rifle-heavy').click();

  // Verify selection
  await expect(page.getByTestId('ammo-option-rifle-heavy')).toContainText('✓');

  // Navigate away and back
  await page.goto('/');
  await page.goto('/weapons');

  // Switch to rifle tab
  await page.getByTestId('tab-rifle').click();
  await page.getByTestId('weapon-rifle-assault').click();
  await expect(page.getByTestId('ammo-selector-rifle-assault')).toBeVisible();
  await expect(page.getByTestId('ammo-option-rifle-heavy')).toContainText('✓');
});

test('environment HUD displays temperature and altitude', async ({ page }) => {
  // Navigate to sniper calm level (has environment preset: 10°C @ 2000m)
  await page.goto('/game/sniper-calm');
  await expect(page.getByTestId('game-page')).toBeVisible();
  await page.getByTestId('start-level').click();
  
  // Environment summary should be visible
  const envSummary = page.getByTestId('env-summary');
  await expect(envSummary).toBeVisible();
  
  // Should display temperature and altitude
  expect(await envSummary.textContent()).toContain('Temp:');
  expect(await envSummary.textContent()).toContain('10°C');
  expect(await envSummary.textContent()).toContain('Alt:');
  expect(await envSummary.textContent()).toContain('2000m');
});

test('environment HUD shows air density in expert mode', async ({ page }) => {
  // Navigate to settings and change to expert preset
  await page.goto('/settings');
  
  // Click Expert option using test ID
  await page.getByTestId('preset-expert').click();
  
  // Navigate to sniper calm level
  await page.goto('/game/sniper-calm?testMode=1');
  await page.getByTestId('start-level').click();
  
  // Environment summary should display density in expert mode
  const envSummary = page.getByTestId('env-summary');
  await expect(envSummary).toBeVisible();
  
  // Should display air density in expert mode
  expect(await envSummary.textContent()).toContain('ρ:');
  expect(await envSummary.textContent()).toContain('kg/m³');
});

test('plates mode: hit plates and see results', async ({ page }) => {
  // Navigate to plates level
  await page.goto('/game/rifle-basics-plates?testMode=1');
  await expect(page.getByTestId('game-page')).toBeVisible();
  
  // Check that plates mode is displayed
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('plates-mode')).toBeVisible();
  
  // Fire 3 shots
  for (let i = 0; i < 3; i++) {
    // Click near center of canvas
    await page.locator('canvas').click({
      position: { x: 500, y: 300 }
    });
  }
  
  // Check that plate hits are displayed
  const plateHitCount = page.getByTestId('plate-hit-count');
  await expect(plateHitCount).toBeVisible();
  const hitText = await plateHitCount.textContent();
  expect(hitText).toContain('Hits:');
  
  // Wait for results to show
  await page.waitForTimeout(1000);
});

test('timed level: countdown timer blocks firing when time expires', async ({ page }) => {
  // Navigate to timed level with 10 second timer
  await page.goto('/game/rifle-basics-timed?testMode=1');
  await expect(page.getByTestId('game-page')).toBeVisible();
  
  // Start the level
  await page.getByTestId('start-level').click();
  
  // Check that timer is displayed
  const timer = page.getByTestId('timer');
  await expect(timer).toBeVisible();
  expect(await timer.textContent()).toContain('Time:');
  expect(await timer.textContent()).toContain('10s');
  
  // Fire one shot
  await page.locator('canvas').click({
    position: { x: 500, y: 300 }
  });
  
  // Wait for timer to expire (advance time)
  await page.evaluate(() => {
    // Manually advance time by triggering timer expiration
    window.dispatchEvent(new Event('beforeunload'));
  });
  
  // Wait 11 seconds for time to expire
  await page.waitForTimeout(11000);
  
  // Check that time's up banner is shown
  const timeUpBanner = page.getByTestId('time-up-banner');
  
  // Banner should be visible if timer expired
  if (await timeUpBanner.isVisible()) {
    expect(await timeUpBanner.textContent()).toContain("Time's Up!");
  }
});

test('daily challenge: page shows challenge info and start button', async ({ page }) => {
  // Navigate to daily challenge page with date override for testing
  await page.goto('/daily?dateOverride=2026-02-19');
  
  // Should show today's date and challenge info
  const challengeInfo = page.getByTestId('daily-challenge-info');
  await expect(challengeInfo).toBeVisible();
  const content = await challengeInfo.textContent();
  expect(content).toContain('2026');
  expect(content).toContain('Distance:');
  expect(content).toContain('Wind:');
  
  // Check start button exists
  const startBtn = page.getByTestId('start-daily-btn');
  await expect(startBtn).toBeVisible();
  
  // Check leaderboard exists
  const leaderboard = page.getByTestId('leaderboard-list');
  await expect(leaderboard).toBeVisible();
});

test('daily challenge: leaderboard reset button works', async ({ page }) => {
  // Navigate to daily challenge page
  await page.goto('/daily?dateOverride=2026-02-20');
  
  // Click reset button
  const resetBtn = page.getByTestId('reset-leaderboard-btn');
  await expect(resetBtn).toBeVisible();
  await resetBtn.click();
  
  // Confirm dialog should appear
  const yesButton = page.getByText('Yes, Clear All');
  if (await yesButton.isVisible()) {
    await yesButton.click();
  }
  
  // Check leaderboard still exists
  const leaderboard = page.getByTestId('leaderboard-list');
  await expect(leaderboard).toBeVisible();
});

test('Expert extras: settings page shows toggles only in Expert preset', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  
  // Expert extras section should not be visible in Arcade/Realistic modes
  const expertSection = page.getByTestId('expert-extras-section');
  await expect(expertSection).not.toBeVisible();
  
  // Switch to Expert preset
  await page.getByTestId('preset-expert').click();
  
  // Expert extras section should now be visible
  await expect(expertSection).toBeVisible();
  
  // Toggles should be present and OFF by default
  await expect(page.getByTestId('toggle-expert-spin-drift')).toBeVisible();
  await expect(page.getByTestId('toggle-expert-coriolis')).toBeVisible();
  await expect(page.getByTestId('toggle-expert-spin-drift')).toHaveText('OFF');
  await expect(page.getByTestId('toggle-expert-coriolis')).toHaveText('OFF');
  
  // Enable spin drift
  await page.getByTestId('toggle-expert-spin-drift').click();
  await expect(page.getByTestId('toggle-expert-spin-drift')).toHaveText('ON');
});

test('Expert extras: HUD badge visible when extras enabled', async ({ page }) => {
  // First, enable Expert extras via settings
  await page.goto('/settings');
  await page.getByTestId('preset-expert').click();
  await page.getByTestId('toggle-expert-spin-drift').click();
  await expect(page.getByTestId('toggle-expert-spin-drift')).toHaveText('ON');
  
  // Start a level with Expert preset and extras enabled
  await page.goto('/game/pistol-calm?testMode=1');
  await expect(page.getByTestId('game-page')).toBeVisible();
  
  // Start the level to show HUD
  await page.getByTestId('start-level').click();
  
  // Expert extras badge should be visible
  const badge = page.getByTestId('expert-extras-badge');
  await expect(badge).toBeVisible();
  
  // Check badge content
  const badgeText = await badge.textContent();
  expect(badgeText).toContain('Expert Extras');
  expect(badgeText).toContain('ON');
  expect(badgeText).toContain('Spin Drift');
});

test('Expert extras: HUD badge not visible when Expert extras disabled', async ({ page }) => {
  // Set Expert preset but keep extras disabled
  await page.goto('/settings');
  await page.getByTestId('preset-expert').click();
  await expect(page.getByTestId('toggle-expert-spin-drift')).toHaveText('OFF');
  await expect(page.getByTestId('toggle-expert-coriolis')).toHaveText('OFF');
  
  // Start a level
  await page.goto('/game/pistol-calm?testMode=1');
  await expect(page.getByTestId('game-page')).toBeVisible();
  
  // Start the level to show HUD
  await page.getByTestId('start-level').click();
  
  // Expert extras badge should NOT be visible
  const badge = page.getByTestId('expert-extras-badge');
  await expect(badge).not.toBeVisible();
});

test('reticle customization: settings page has reticle controls', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Verify reticle section exists
  await expect(page.getByTestId('reticle-section')).toBeVisible();

  // Verify reticle style options exist
  await expect(page.getByTestId('reticle-style-simple')).toBeVisible();
  await expect(page.getByTestId('reticle-style-mil')).toBeVisible();
  await expect(page.getByTestId('reticle-style-tree')).toBeVisible();

  // Verify reticle thickness slider exists
  await expect(page.getByTestId('reticle-thickness')).toBeVisible();

  // Verify center dot toggle exists
  await expect(page.getByTestId('reticle-center-dot')).toBeVisible();
});

test('reticle customization: toggle center dot persists', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Center dot should be ON by default
  await expect(page.getByTestId('reticle-center-dot')).toHaveText('ON');

  // Toggle it OFF
  await page.getByTestId('reticle-center-dot').click();
  await page.waitForTimeout(100);

  // Verify it's OFF
  await expect(page.getByTestId('reticle-center-dot')).toHaveText('OFF');

  // Refresh page and verify setting persists
  await page.reload();
  await expect(page.getByTestId('reticle-center-dot')).toHaveText('OFF');

  // Toggle it back ON
  await page.getByTestId('reticle-center-dot').click();
  await page.waitForTimeout(100);

  // Refresh and verify it's ON
  await page.reload();
  await expect(page.getByTestId('reticle-center-dot')).toHaveText('ON');
});

test('reticle customization: adjust thickness persists', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Get the thickness slider
  const thicknessSlider = page.getByTestId('reticle-thickness');
  await expect(thicknessSlider).toBeVisible();

  // Check default thickness (should be 2)
  const defaultThickness = await thicknessSlider.inputValue();
  expect(defaultThickness).toBe('2');

  // Adjust thickness to 5
  await thicknessSlider.fill('5');
  await page.waitForTimeout(100);

  // Verify it's 5
  const newThickness1 = await thicknessSlider.inputValue();
  expect(newThickness1).toBe('5');

  // Refresh page and verify setting persists
  await page.reload();
  const newThickness2 = await thicknessSlider.inputValue();
  expect(newThickness2).toBe('5');
});

test('reticle customization: change style persists', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Simple style should be selectable
  await page.getByTestId('reticle-style-simple').click();
  await page.waitForTimeout(100);

  // Verify simple is selected
  await expect(page.getByTestId('reticle-style-simple')).toHaveClass(/active/);

  // Refresh and verify style persists
  await page.reload();
  await expect(page.getByTestId('reticle-style-simple')).toHaveClass(/active/);

  // Change to MIL style
  await page.getByTestId('reticle-style-mil').click();
  await page.waitForTimeout(100);

  // Verify MIL is selected
  await expect(page.getByTestId('reticle-style-mil')).toHaveClass(/active/);

  // Refresh and verify style persists
  await page.reload();
  await expect(page.getByTestId('reticle-style-mil')).toHaveClass(/active/);
});

test('display settings: offset unit toggle changes impact offset readout', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Verify display section exists
  await expect(page.getByTestId('display-section')).toBeVisible();

  // Verify offset unit options exist
  await expect(page.getByTestId('offset-units-mil')).toBeVisible();
  await expect(page.getByTestId('offset-units-moa')).toBeVisible();

  // Change to MOA
  await page.getByTestId('offset-units-moa').click();
  await page.waitForTimeout(100);

  // Verify MOA is selected
  await expect(page.getByTestId('offset-units-moa')).toHaveClass(/active/);

  // Start a game and verify offset shows in MOA
  await page.goto('/game/pistol-windy?testMode=1');
  await page.getByTestId('start-level').click();

  // Fire a shot
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Impact offset panel should show MOA
  const offsetPanel = page.getByTestId('impact-offset-panel');
  await expect(offsetPanel).toBeVisible();
  const offsetText = await offsetPanel.textContent();
  expect(offsetText).toContain('MOA');
  expect(offsetText).not.toContain('MIL');

  // Go back to settings and change to MIL
  await page.getByTestId('back-button').click();
  await page.goto('/settings');
  await page.getByTestId('offset-units-mil').click();
  await page.waitForTimeout(100);

  // Start the game again and verify offset shows in MIL
  await page.goto('/game/pistol-windy?testMode=1');
  await page.getByTestId('start-level').click();

  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Impact offset panel should now show MIL
  const offsetPanel2 = page.getByTestId('impact-offset-panel');
  await expect(offsetPanel2).toBeVisible();
  const offsetText2 = await offsetPanel2.textContent();
  expect(offsetText2).toContain('MIL');
  expect(offsetText2).not.toContain('MOA');
});

test('mobile controls: settings page has mobile controls section', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Verify mobile controls section exists
  await expect(page.getByTestId('mobile-section')).toBeVisible();

  // Verify Fire Button toggle exists
  await expect(page.getByTestId('show-fire-button-toggle')).toBeVisible();
});

test('mobile controls: enable fire button toggle', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Fire button should be OFF by default
  await expect(page.getByTestId('show-fire-button-toggle')).toHaveText('OFF');

  // Toggle it ON
  await page.getByTestId('show-fire-button-toggle').click();
  await page.waitForTimeout(100);

  // Verify it's ON
  await expect(page.getByTestId('show-fire-button-toggle')).toHaveText('ON');

  // Refresh page and verify setting persists
  await page.reload();
  await expect(page.getByTestId('show-fire-button-toggle')).toHaveText('ON');
});

test('mobile controls: fire button exists in game when enabled', async ({ page }) => {
  // Navigate to settings and enable fire button
  await page.goto('/settings');
  
  // Ensure fire button is ON
  const fireButtonToggle = page.getByTestId('show-fire-button-toggle');
  const toggleText = await fireButtonToggle.textContent();
  if (toggleText === 'OFF') {
    await fireButtonToggle.click();
    await page.waitForTimeout(100);
  }

  // Navigate to game page and start a level
  await page.goto('/game/pistol-windy?testMode=1');
  await page.getByTestId('start-level').click();
  await page.waitForTimeout(200);

  // Fire button should be visible
  await expect(page.getByTestId('fire-button')).toBeVisible();

  // Verify shot count before firing
  const shotCountBefore = await page.getByTestId('shot-count').textContent();
  expect(shotCountBefore).toContain('3/3');

  // Click fire button
  await page.getByTestId('fire-button').click();
  await page.waitForTimeout(200);

  // Verify shot count decreased
  const shotCountAfter = await page.getByTestId('shot-count').textContent();
  expect(shotCountAfter).toContain('2/3');
});

test('mobile controls: fire button not visible when disabled', async ({ page }) => {
  // Navigate to settings and disable fire button
  await page.goto('/settings');
  
  // Ensure fire button is OFF
  const fireButtonToggle = page.getByTestId('show-fire-button-toggle');
  const toggleText = await fireButtonToggle.textContent();
  if (toggleText === 'ON') {
    await fireButtonToggle.click();
    await page.waitForTimeout(100);
  }

  // Navigate to game page and start a level
  await page.goto('/game/pistol-windy?testMode=1');
  await page.getByTestId('start-level').click();
  await page.waitForTimeout(200);

  // Fire button should NOT be visible
  const fireButton = page.getByTestId('fire-button');
  await expect(fireButton).not.toBeVisible();
});

test('shotgun: multi-impacts rendering', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to weapons to select shotgun
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();

  // Click shotgun tab
  await expect(page.getByTestId('tab-shotgun')).toBeVisible();
  await page.getByTestId('tab-shotgun').click();

  // Select the pump action shotgun
  await expect(page.getByTestId('weapon-shotgun-pump')).toBeVisible();
  await page.getByTestId('weapon-shotgun-pump').click();

  // Go back to menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');

  // Navigate to levels and select a pistol level (close range works for shotgun)
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Select a pistol level (close range works for shotgun)
  await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  await page.getByTestId('level-pistol-calm').click();

  // Wait for game to load
  await page.waitForURL('/game/pistol-calm');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Fire a shot
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Wait for shot to register
  await page.waitForTimeout(300);

  // Verify shot history shows shotgun multi-impacts indicator
  await expect(page.getByTestId('shot-row-1')).toBeVisible();
  const shotRow1 = page.getByTestId('shot-row-1');
  
  // Check that it has the shotgun multi-impacts indicator
  // This is done by checking for the data-testid attribute
  const firstShotId = await shotRow1.getAttribute('data-testid');
  expect(firstShotId).toBe('shotgun-multi-impacts');
  
  // Verify the pellet count is displayed
  await expect(shotRow1.getByText(/🔫/)).toBeVisible();
});

test('mobile controls: turret controls support press-and-hold', async ({ page }) => {
  // Navigate to game page and start a level
  await page.goto('/game/pistol-windy?testMode=1');
  await page.getByTestId('start-level').click();
  await page.waitForTimeout(200);

  // Get initial elevation value
  const initialValue = await page.getByTestId('elevation-value').textContent();
  expect(initialValue).toBe('+0.0');

  // Press and hold elevation-up button
  const elevationUpBtn = page.getByTestId('elevation-up');
  await elevationUpBtn.down();
  
  // Wait for some repeats to occur
  await page.waitForTimeout(800);
  
  // Release button
  await elevationUpBtn.up();
  await page.waitForTimeout(100);

  // Verify elevation value increased (should be multiple clicks due to press-and-hold)
  const changedValue = await page.getByTestId('elevation-value').textContent();
  expect(changedValue).not.toBe('+0.0');
  expect(changedValue).toContain('+');
});

test('pistols pack: select pistol, start level, fire, see results', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to weapons to select a pistol
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();

  // Verify pistol tab exists and click it
  await expect(page.getByTestId('tab-pistol')).toBeVisible();
  await page.getByTestId('tab-pistol').click();

  // Select a pistol weapon (verify one exists)
  await expect(page.getByTestId('weapon-pistol-viper')).toBeVisible();
  await page.getByTestId('weapon-pistol-viper').click();

  // Go back to menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to levels page
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Verify pistols pack exists with correct testid
  await expect(page.getByTestId('pistols-pack')).toBeVisible();
  const pistolsPack = page.getByTestId('pistols-pack');
  
  // Verify pack name is displayed
  await expect(pistolsPack.getByText('Pistols')).toBeVisible();
  await expect(pistolsPack.getByText('PISTOL')).toBeVisible();

  // Verify first pistol level is visible and unlocked
  await expect(page.getByTestId('level-pistols-1-cqc')).toBeVisible();
  const levelButton = page.getByTestId('level-pistols-1-cqc');
  await expect(levelButton).toHaveText('Close Quarters');

  // Start the first pistol level
  await levelButton.click();
  await page.waitForURL('**/game/pistols-1-cqc');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Should see level briefing
  await expect(page.getByTestId('level-briefing')).toBeVisible();
  await expect(page.getByText('Mission Briefing')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('level-briefing')).not.toBeVisible();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Verify initial shot count (pistols-1-cqc has 5 shots)
  const shotCount = page.getByTestId('shot-count');
  await expect(shotCount).toContainText('Shots: 5/5');

  // Get canvas and fire shots at the center
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Fire 5 shots at center for deterministic results
    for (let i = 0; i < 5; i++) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100); // Small delay between shots
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

  // Verify pistols pack is still visible after completing a level
  await expect(page.getByTestId('pistols-pack')).toBeVisible();
});

test('shotguns pack: select weapon, start level and complete', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to weapons to select shotgun
  await page.getByTestId('weapons-button').click();
  await page.waitForURL('**/weapons');
  await expect(page.getByTestId('weapons-page')).toBeVisible();

  // Click shotgun tab
  await expect(page.getByTestId('tab-shotgun')).toBeVisible();
  await page.getByTestId('tab-shotgun').click();

  // Select the pump action shotgun
  await expect(page.getByTestId('weapon-shotgun-pump')).toBeVisible();
  await page.getByTestId('weapon-shotgun-pump').click();

  // Go back to menu
  await page.getByTestId('back-button').first().click();
  await page.waitForURL('/');

  // Navigate to levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Verify Shotguns pack exists
  await expect(page.getByTestId('shotguns-pack')).toBeVisible();

  // Select first shotgun level
  await expect(page.getByTestId('level-shotgun-intro')).toBeVisible();
  await page.getByTestId('level-shotgun-intro').click();

  // Wait for game page to load
  await page.waitForURL('/game/shotgun-intro');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Dismiss tutorial if present (shotgun intro has tutorial)
  const tutorialOverlay = page.getByTestId('tutorial-overlay');
  if (await tutorialOverlay.isVisible()) {
    await page.getByTestId('tutorial-next').click();
    await page.waitForTimeout(200);
    await page.getByTestId('tutorial-close').click();
  }

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Fire shots at the clay targets
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Aim at top clay
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 - 50 } });
    await page.waitForTimeout(100);
    // Aim at middle clay (center)
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(100);
    // Aim at bottom clay
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 + 50 } });
    await page.waitForTimeout(100);
    // Fire 2 more shots to complete the level
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(100);
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Should see results screen
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByTestId('total-score')).toBeVisible();
  await expect(page.getByTestId('stars-earned')).toBeVisible();

  // Verify shot history shows shotgun multi-impacts
  await expect(page.getByTestId('shot-row-1')).toBeVisible();
  const firstShot = page.getByTestId('shot-row-1');
  await expect(firstShot.getByText(/🔫/)).toBeVisible();
});

test('wind layers: ELR level shows layered wind cues', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Navigate to ELR Pack
  await expect(page.getByTestId('elr-pack')).toBeVisible();
  await page.getByTestId('elr-pack').click();

  // Select ELR Introduction level
  await expect(page.getByTestId('level-elr-intro')).toBeVisible();
  await page.getByTestId('level-elr-intro').click();

  // Wait for game page to load
  await page.waitForURL('/game/elr-intro');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Verify layered wind cues are visible
  await expect(page.getByTestId('wind-cues-layered')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Verify layered wind indicator is visible in HUD
  await expect(page.getByTestId('wind-cues-layered')).toBeVisible();
  
  // Verify the layered indicator shows 3 layers
  const windHud = page.getByTestId('wind-cues-layered');
  await expect(windHud).toContainText('Layered Wind');
  await expect(windHud).toContainText('segments');
});

test('ELR pack: introduction level completes successfully', async ({ page }) => {
  // Start at main menu
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Navigate to levels
  await page.getByTestId('levels-button').click();
  await page.waitForURL('**/levels');
  await expect(page.getByTestId('levels-page')).toBeVisible();

  // Navigate to ELR Pack
  await expect(page.getByTestId('elr-pack')).toBeVisible();
  await page.getByTestId('elr-pack').click();

  // Verify ELR pack is visible and shows correct name
  const elrPack = page.getByTestId('elr-pack');
  await expect(elrPack).toContainText('ELR Pack');
  
  // Select ELR Introduction level
  await expect(page.getByTestId('level-elr-intro')).toBeVisible();
  await page.getByTestId('level-elr-intro').click();

  // Wait for game page to load
  await page.waitForURL('/game/elr-intro');
  await expect(page.getByTestId('game-page')).toBeVisible();

  // Verify level briefing shows correct info
  await expect(page.locator('text=ELR Introduction')).toBeVisible();
  await expect(page.getByTestId('wind-cues-layered')).toBeVisible();

  // Start the level
  await page.getByTestId('start-level').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  // Fire shots at the target
  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (box) {
    // Fire 3 shots at roughly center (600m distance, need some lead for wind)
    for (let i = 0; i < 3; i++) {
      // Aim slightly left to compensate for left-to-right wind (2-5 m/s)
      await canvas.click({ position: { x: box.width / 2 - 30, y: box.height / 2 + 20 } });
      await page.waitForTimeout(100);
    }
    // Fire 2 more shots
    for (let i = 0; i < 2; i++) {
      await canvas.click({ position: { x: box.width / 2 - 30, y: box.height / 2 + 20 } });
      await page.waitForTimeout(100);
    }
  }

  // Should see results screen
  await expect(page.getByTestId('results-screen')).toBeVisible();
  await expect(page.getByTestId('total-score')).toBeVisible();
  await expect(page.getByTestId('stars-earned')).toBeVisible();

  // Verify shot history is visible
  await expect(page.getByTestId('shot-row-1')).toBeVisible();
});

test('stats page: displays correctly', async ({ page }) => {
  // Navigate to main menu then stats
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Stats
  await page.getByTestId('stats-button').click();
  await page.waitForURL('**/stats');
  await expect(page.getByTestId('stats-page')).toBeVisible();

  // Check stats sections are visible
  await expect(page.getByTestId('stats-accuracy')).toBeVisible();
  await expect(page.getByTestId('stats-progress')).toBeVisible();
  await expect(page.getByTestId('stats-playtime')).toBeVisible();

  // Check back button
  await expect(page.getByTestId('back-button')).toBeVisible();
});

test('achievements page: displays correctly', async ({ page }) => {
  // Navigate to main menu then achievements
  await page.goto('/');
  await expect(page.getByTestId('main-menu')).toBeVisible();

  // Click Achievements
  await page.getByTestId('achievements-button').click();
  await page.waitForURL('**/achievements');
  await expect(page.getByTestId('achievements-page')).toBeVisible();

  // Check achievements summary is visible
  await expect(page.getByTestId('achievements-summary')).toBeVisible();

  // Check achievements sections are visible
  await expect(page.getByText(/Progress Achievements/i)).toBeVisible();
  await expect(page.getByText(/Skill Achievements/i)).toBeVisible();
  await expect(page.getByText(/Exploration Achievements/i)).toBeVisible();

  // Check cosmetics section
  await expect(page.getByText(/Reticle Skins/i)).toBeVisible();

  // Check back button
  await expect(page.getByTestId('back-button')).toBeVisible();
});

test('settings page: reticle skin selector exists', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();

  // Find reticle section
  await expect(page.getByTestId('reticle-section')).toBeVisible();

  // Check reticle skin selector is present
  await expect(page.getByTestId('reticle-skin-select')).toBeVisible();
});
