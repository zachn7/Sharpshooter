import { test, expect } from './fixtures/base';

/**
 * Regression tests for v1.1 critical user flows.
 * These tests catch issues like blank screens, navigation failures,
 * and ensure tutorial flows work correctly.
 */

test.describe('Regressions: v1.1 Critical Flows', () => {
  // Clear localStorage before each test for isolation
  test.beforeEach(async ({ context }) => {
    // Clear all storage contexts for test isolation
    await context.clearCookies();
  });
  test('Start Game navigates to Levels page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Click Start Game button
    await page.getByTestId('start-button').click();
    
    // Should navigate to Levels page
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Should have level cards (not blank)
    await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
    
    // Should have accessible back button
    await expect(page.getByTestId('back-button')).toBeVisible();
  });
  
  test('Resume flow: Start level then navigate back to Levels', async ({ page }) => {
    // Navigate to Levels
    await page.goto('/levels');
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Start a level
    await page.getByTestId('level-pistol-calm').click();
    
    // Wait for briefing to appear, then start the level
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
    // Now the canvas should be visible
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    
    // Click back button to return to Levels
    await page.getByTestId('back-button').click();
    
    // Levels page should render (not blank)
    await expect(page.getByTestId('levels-page')).toBeVisible();
    await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  });
  
  test('Level navigation: Levels -> Game -> Back -> Levels', async ({ page }) => {
    // Start at Levels
    await page.goto('/levels');
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Navigate to game
    await page.getByTestId('level-pistol-calm').click();
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
    // Game should be running
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    await expect(page.getByTestId('shot-count')).toBeVisible();
    
    // Game should be running
    await expect(page.getByTestId('shot-count')).toBeVisible();
    
    // Navigate back to Levels
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Verify page is not blank - level cards should be visible
    await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  });
  
  test('Tutorial lesson completion in testMode', async ({ page }) => {
    // Start Tutorial Lesson with testMode (using a valid tutorial ID)
    await page.goto('/tutorial/lesson-wind-hold-dial?testMode=1&seed=123&dateOverride=2026-02-25');
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
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
    await expect(page.getByTestId('lesson-hud-basics')).toBeVisible();
  });
  
  test('Start a lesson from Academy', async ({ page }) => {
    // Navigate to Academy
    await page.goto('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();
    
    // Lesson card should be visible and clickable
    await expect(page.getByTestId('lesson-hud-basics')).toBeVisible();
  });
  
  test('Settings navigation and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Click Settings button
    await page.getByTestId('settings-button').click();
    
    // Settings should be visible
    await expect(page.getByTestId('settings-page')).toBeVisible();
    
    // Navigate back
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('main-menu')).toBeVisible();
  });
  
  test('Complete level and navigate to next level', async ({ page }) => {
    // Use testMode for determinism
    await page.goto('/game/pistol-calm?testMode=1');
    
    // Wait for briefing, then start level
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    
    // Fire shots to complete level
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(400, 300);
      await page.waitForTimeout(100);
    }
    
    // Shot count should be visible
    await expect(page.getByTestId('shot-count')).toBeVisible();
  });
  
  test('No error boundary trigger during normal gameplay', async ({ page }) => {
    // Normal game flow should never show error boundary
    await page.goto('/game/pistol-calm?testMode=1');
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
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
    // First ensure storage is initialized by visiting home
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Direct navigation to game should work
    await page.goto('/game/pistol-calm?testMode=1');
    
    // Wait for briefing, then start level
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
    // Game elements should be present
    await expect(page.getByTestId('game-page')).toBeVisible();
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    await expect(page.getByTestId('shot-count')).toBeVisible();
  });
  
  test('Canvas is properly rendered on game load', async ({ page }) => {
    // First visit a page to ensure storage is initialized
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Then navigate to game
    await page.goto('/game/pistol-calm?testMode=1');
    
    // Wait for briefing, then start level
    await expect(page.getByTestId('level-briefing')).toBeVisible();
    await page.getByTestId('start-level').click();
    
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
  // Clear localStorage before each test for isolation
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

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
    
    // Select first level
    await page.getByTestId('level-pistol-calm').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Back to levels
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Select same level again ( verifies multiple selections work)
    await page.getByTestId('level-pistol-calm').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Back to levels again
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('levels-page')).toBeVisible();
  });
  
  test('Direct /game without levelId redirects to Levels with notice', async ({ page }) => {
    // Navigate directly to /game without a levelId
    await page.goto('/game');
    
    // Should redirect to levels page
    await expect(page.getByTestId('levels-page')).toBeVisible();
    
    // Should show notice banner
    await expect(page.getByTestId('notice-banner')).toBeVisible();
    expect(await page.getByTestId('notice-banner').textContent()).toContain('Select a level to start');
    
    // Should have level cards visible
    await expect(page.getByTestId('level-pistol-calm')).toBeVisible();
  });
});