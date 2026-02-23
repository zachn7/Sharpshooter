import { test, expect } from '@playwright/test';

test.describe('Tutorial Academy', () => {
  test('complete Lesson 1 flow end-to-end', async ({ page }) => {
    // Start at academy
    await page.goto('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();

    // First complete the prerequisite lesson (welcome)
    await page.getByTestId('lesson-welcome').click();
    await expect(page.getByTestId('lesson-overlay')).toBeVisible();
    
    // Navigate through all steps (welcome has 3 steps)
    await page.getByText('Next').click();
    await page.getByText('Next').click(); // Step 2 of 3
    await page.getByText('Got It!').click(); // Step 3 of 3
    
    // Back at academy
    await expect(page).toHaveURL('/academy');
    
    // Now HUD Basics should be unlocked
    await expect(page.getByTestId('lesson-hud-basics')).toBeEnabled();

    // Click on HUD Basics lesson (Lesson 1)
    await page.getByTestId('lesson-hud-basics').click();

    // Should see lesson overlay
    await expect(page.getByTestId('lesson-overlay')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'HUD Basics' })).toBeVisible();

    // Step 1: The Distance Display
    await expect(page.getByRole('heading', { name: 'The Distance Display' })).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await page.getByText('Next').click();
    await expect(page.getByText('Step 2 of 4')).toBeVisible();

    // Step 2: The Wind Indicator with practice button
    await expect(page.getByText('The Wind Indicator')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start interactive practice' })).toBeVisible();
    await page.getByRole('button', { name: 'Start interactive practice' }).click();
    // Should navigate to game with tutorial ID
    await expect(page).toHaveURL(/.*\/game\/tutorial\?tutorialId=lesson-hud-basics.*/);
    await expect(page.getByTestId('game-page')).toBeVisible();

    // Click back to return to academy
    await page.getByTestId('back-button').click();
    // Navigate back to academy
    await page.goto('/academy');

    // Lesson overlay should be closed
    await expect(page.getByTestId('lesson-overlay')).not.toBeVisible();
  });

  test('hud-basics lesson shows testids for highlighting', async ({ page }) => {
    // Start at academy
    await page.goto('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();

    // First complete the prerequisite lesson (welcome)
    await page.getByTestId('lesson-welcome').click();
    await page.getByText('Next').click();
    await page.getByText('Next').click(); // Step 2 of 3
    await page.getByText('Got It!').click(); // Step 3 of 3
    
    // Now start HUD Basics lesson
    await page.getByTestId('lesson-hud-basics').click();
    await expect(page.getByTestId('lesson-overlay')).toBeVisible();

    // Verify lesson overlay structure
    await expect(page.getByRole('heading', { name: 'HUD Basics' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    // Close the lesson using Skip Tutorial
    await page.getByText('Skip Tutorial').click();
    await expect(page.getByTestId('lesson-overlay')).not.toBeVisible();
  });

  test('navigate to academy from main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // Academies button should be visible
    const academyButton = page.getByTestId('academy-button');
    await expect(academyButton).toBeVisible();
    
    await academyButton.click();
    await expect(page).toHaveURL('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();
  });

  test('start and navigate through a lesson', async ({ page }) => {
    await page.goto('/academy');
    await expect(page.getByTestId('academy-page')).toBeVisible();

    // Click on the welcome lesson
    await page.getByTestId('lesson-welcome').click();

    // Should see lesson overlay
    await expect(page.getByTestId('lesson-overlay')).toBeVisible();

    // Navigate through steps
    await page.getByText('Next').click();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();

    await page.getByText('Next').click();
    await expect(page.getByText('Got It!')).toBeVisible();

    // Close the lesson
    await page.getByText('Got It!').click();
    await expect(page.getByTestId('lesson-overlay')).not.toBeVisible();
  });

  test('Lesson 3 shows Coach card and applies correction', async ({ page }) => {
    // Start at academy
    await page.goto('/academy');
    
    // Click on Turret Clicks lesson (Lesson 3)
    await page.getByTestId('lesson-turret-clicks').click();
    await expect(page.getByTestId('lesson-overlay')).toBeVisible();
    
    // Navigate to practice step
    await page.getByText('Next').click();
    await page.getByText('Next').click();
    await page.getByText('Next').click();
    await expect(page.getByText('Practice')).toBeVisible();
    
    // Start practice game
    await page.getByRole('button', { name: /Start interactive practice/ }).click();
    await expect(page).toHaveURL(/.*\/game\/tutorial\?tutorialId=lesson-turret-clicks.*/);
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Fire a shot
    await page.mouse.click(400, 300); // Click in center
    await expect(page.getByTestId('impact-offset-panel')).toBeVisible();
    
    // Coach card should appear in tutorial mode
    await expect(page.getByTestId('coach-card')).toBeVisible();
    await expect(page.getByText('Coach Recommendation')).toBeVisible();
    await expect(page.getByText('Tutorial Mode')).toBeVisible();
    
    // Apply button should be visible
    await expect(page.getByTestId('coach-apply')).toBeVisible();
    
    // Click Apply to auto-correct
    await page.getByTestId('coach-apply').click();
    
    // Verify turret values are displayed
    await expect(page.getByTestId('elevation-value')).toBeVisible();
    
    // Navigate back to academy
    await page.getByTestId('back-button').click();
    await expect(page).toHaveURL('/academy');
  });
});

test.describe('Glossary', () => {
  test('open glossary from main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('main-menu')).toBeVisible();

    // Click help button
    await page.getByText(/Help.*Glossary/).click();

    // Should show glossary drawer
    await expect(page.getByTestId('glossary-open')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Glossary' })).toBeVisible();
  });

  test('close glossary and return to menu', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Help.*Glossary/).click();
    await expect(page.getByTestId('glossary-open')).toBeVisible();

    // Click close button
    await page.getByTestId('glossary-backdrop').click();

    // Glossary should be closed
    await expect(page.getByTestId('glossary-open')).not.toBeVisible();
    await expect(page.getByTestId('main-menu')).toBeVisible();

    // Menu should be fully loaded (not blank)
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('academy-button')).toBeVisible();
  });
});

test.describe('HUD Readability', () => {
  test('basic HUD renders by default', async ({ page }) => {
    // Start a game directly with a simple level
    await page.goto('/game/level-1');
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Basic HUD should be visible
    await expect(page.getByTestId('hud-basic')).toBeVisible();
    
    // Basic HUD shows: Shots, Score (timer and plates mode may or may not be present)
    await expect(page.getByTestId('shot-count')).toBeVisible();
    
    // Start game
    await page.mouse.click(400, 300);
    
    // Wind cue should be visible (always in Basic mode)
    await expect(page.getByTestId('wind-cues')).toBeVisible();
    
    // Advanced HUD elements should NOT be visible
    await expect(page.getByTestId('env-summary')).not.toBeVisible();
  });
  
  test('switch to advanced HUD shows additional info', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();
    
    // Switch to Advanced HUD mode
    await page.getByTestId('hud-mode-advanced').click();
    await expect(page.getByTestId('hud-mode-advanced')).toHaveAttribute('aria-pressed', 'true');
    
    // Start a game
    await page.goto('/game/level-1');
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Advanced HUD should be visible
    await expect(page.getByTestId('hud-advanced')).toBeVisible();
    
    // Start game to trigger HUD elements
    await page.mouse.click(400, 300);
    
    // Advanced HUD shows Environment info
    await expect(page.getByTestId('env-summary')).toBeVisible();
  });
  
  test('return to main menu', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('game-page')).toBeVisible();
    
    // Navigate back to main menu
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('main-menu')).toBeVisible();
    
    // All menu items should be visible
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('academy-button')).toBeVisible();
  });
});
