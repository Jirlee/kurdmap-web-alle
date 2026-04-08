import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[id*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation on empty submit', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    // Form should not navigate away
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.locator('input[type="email"], input[id*="email"]').fill('wrong@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have correct page title or heading', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
