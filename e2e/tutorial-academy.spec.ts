import { test, expect } from '@playwright/test';

test.describe('Tutorial Academy', () => {
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
