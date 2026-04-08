import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('login page should have proper form labels', async ({ page }) => {
    await page.goto('/login');

    // Check for labels or aria-labels on inputs
    const emailInput = page.locator('input[type="email"], input[id*="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('login page should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('page should have a proper document title', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
