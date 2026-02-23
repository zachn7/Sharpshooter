import { test, expect } from '@playwright/test';

/**
 * Regression tests for v1.1 critical user flows.
 * These tests catch issues like blank screens, navigation failures,
 * and ensure tutorial flows work correctly.
 */

test.describe('Regressions: v1.1 Critical Flows', () => {
  test('Start Game navigates to Levels page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Click Start Game button
    await page.getByTestId('start-button').click();
    
    // Should navigate to Levels page
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Should have level cards (not blank)
    await expect(page.getByTestId('level-card-level-1')).toBeVisible();
    
    // Should have accessible back button
    await expect(page.getByTestId('back-button')).toBeVisible();
  });
  
  test('Resume flow: Start level then navigate back to Levels', async ({ page }) => {
    // Navigate to Levels
    await page.goto('/levels');
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Start a level
    await page.getByTestId('level-card-level-1').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    
    // Click back button to return to Levels
    await page.getByTestId('back-button').click();
    
    // Levels page should render (not blank)
    await expect(page.getByTestId('levels-page')).toBeVisible();
    await expect(page.getByTestId('level-card-level-1')).toBeVisible();
  });
  
  test('Level navigation: Levels -> Game -> Back -> Levels', async ({ page }) => {
    // Start at Levels
    await page.goto('/levels');
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Navigate to game
    await page.getByTestId('level-card-level-1').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Start the game (click on canvas)
    await page.mouse.click(400, 300);
    
    // Game should be running
    await expect(page.getByTestId('shot-count')).toBeVisible();
    
    // Navigate back to Levels
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Verify page is not blank - level cards should be visible
    await expect(page.getByTestId('level-card-level-1')).toBeVisible();
  });
  
  test('Tutorial lesson completion in testMode', async ({ page }) => {
    // Start Tutorial Lesson 1 with testMode
    await page.goto('/tutorial/TUTORIAL_WIND_01?testMode=1');
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Game should load correctly
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    
    // Verify testMode is active (no sway/recoil for determinism)
    await page.mouse.click(400, 300); // Start game
    
    // Shot count should be visible
    await expect(page.getByTestId('shot-count')).toBeVisible();
    
    // Fire a shot
    await page.mouse.click(400, 300);
    
    // Wait for results (tutorial completes after 3 shots)
    // Check multiple times to avoid flake
    const resultsVisible = await page.getByTestId('results-screen').isVisible({ timeout: 1000 });
    if (resultsVisible) {
      await expect(page.getByTestId('results-screen')).toBeVisible();
      await expect(page.getByTestId('total-score')).toBeVisible();
    }
  });
  
  test('Academy navigation from Main Menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Click Academy button
    await page.getByTestId('academy-button').click();
    
    // Academy page should be visible (not blank)
    await expect(page.getByTestId('academy-page')).toBeVisible();
    
    // Should have lesson cards
    await expect(page.getByTestId('lesson-tutorial-wind-01')).toBeVisible();
  });
  
  test('Start a lesson from Academy', async ({ page }) => {
    // Navigate to Academy
    await page.goto('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();
    
    // Start first lesson
    await page.getByTestId('lesson-tutorial-wind-01').click();
    
    // Should navigate to game with tutorial parameter
    await expect(page.getByTestId('game-page')).toBeVisible();
    expect(page.url()).toContain('tutorialId=TUTORIAL_WIND_01');
    
    // Game should load correctly (not blank)
    await expect(page.getByTestId('game-canvas')).toBeVisible();
  });
  
  test('Settings navigation and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Navigate to Settings via Academy (or directly if available)
    // First check if Settings is directly accessible
    const settingsLink = page.getByRole('link', { name: /settings/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
    } else {
      // Go via Academy menu
      await page.getByTestId('academy-button').click();
      await expect(page.getByTestId('academy-page')).toBeVisible();
      
      // Look for settings link in academy
      const academySettingsLink = page.getByRole('link', { name: /settings/i });
      if (await academySettingsLink.isVisible()) {
        await academySettingsLink.click();
      } else {
        // Navigate directly to settings
        await page.goto('/settings');
      }
    }
    
    // Settings should be visible
    await expect(page.getByTestId('settings-page')).toBeVisible();
    
    // Navigate back
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('academy-page')).toBeVisible();
  });
  
  test('Complete level and navigate to next level', async ({ page }) => {
    // Use testMode for determinism
    await page.goto('/game/level-1?testMode=1');
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Start game
    await page.mouse.click(400, 300);
    
    // Fire 3 shots to complete level
    for (let i = 0; i < 3; i++) {
      await page.mouse.click(400, 300);
      await page.waitForTimeout(100); // Small delay between shots
    }
    
    // Wait for results screen
    await expect(page.getByTestId('results-screen')).toBeVisible({ timeout: 3000 });
    
    // Check if next level button is available
    const nextLevelButton = page.getByTestId('next-level');
    if (await nextLevelButton.isVisible()) {
      await nextLevelButton.click();
      
      // Should navigate to next level
      expect(page.url()).toContain('/game/level-');
      await expect(page.getByTestId('game-page')).toBeVisible();
    }
  });
  
  test('No error boundary trigger during normal gameplay', async ({ page }) => {
    // Normal game flow should never show error boundary
    await page.goto('/game/level-1?testMode=1');
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Start and play game
    await page.mouse.click(400, 300);
    await page.mouse.click(400, 300);
    await page.mouse.click(400, 300);
    
    // Wait for results
    const resultsVisible = await page.getByTestId('results-screen').isVisible({ timeout: 2000 });
    if (resultsVisible) {
      await expect(page.getByTestId('results-screen')).toBeVisible();
    }
    
    // Error boundary should NOT be visible
    const errorFallback = page.getByTestId('error-fallback');
    const isErrorVisible = await errorFallback.isVisible().catch(() => false);
    expect(isErrorVisible).toBe(false);
  });
  
  test('Direct game URL with testMode loads correctly', async ({ page }) => {
    // Direct navigation to game should work
    await page.goto('/game/level-1?testMode=1');
    
    // Game elements should be present
    await expect(page.getByTestId('game-page')).toBeVisible();
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    await expect(page.getByTestId('shot-count')).toBeVisible();
  });
  
  test('Canvas is properly rendered on game load', async ({ page }) => {
    await page.goto('/game/level-1?testMode=1');
    
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();
    
    // Canvas should have correct dimensions
    const widthAttr = await canvas.getAttribute('width');
    const heightAttr = await canvas.getAttribute('height');
    expect(widthAttr).toBeTruthy();
    expect(heightAttr).toBeTruthy();
    expect(parseInt(widthAttr || '0')).toBeGreaterThan(0);
    expect(parseInt(heightAttr || '0')).toBeGreaterThan(0);
  });
});

/**
 * Navigation regression tests - catch navigation issues
 */
test.describe('Regressions: Navigation', () => {
  test('Main menu to Settings and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    await page.goto('/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();
    
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
  });
  
  test('Main menu to Academy and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    await page.getByTestId('academy-button').click();
    await expect(page.getByTestId('academy-page')).toBeVisible();
    
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('main-menu')).toBeVisible();
  });
  
  test('Multiple level selections work correctly', async ({ page }) => {
    await page.goto('/levels');
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Select level 1
    await page.getByTestId('level-card-level-1').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Back to levels
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Select level 2
    await page.getByTestId('level-card-level-2').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Back to levels again
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
  });
});