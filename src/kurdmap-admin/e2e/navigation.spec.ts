import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  test('unauthenticated user should redirect to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown route should redirect to login or home', async ({ page }) => {
    await page.goto('/nonexistent-page');
    // Should redirect (either to login if unauthenticated, or home if authenticated)
    await page.waitForURL(/\/(login)?$/);
    const url = page.url();
    expect(url).toMatch(/\/(login)?$/);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    // Page should load without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Protected Routes (unauthenticated)', () => {
  const protectedRoutes = [
    '/businesses',
    '/categories',
    '/cities',
    '/users',
    '/advertisements',
    '/reviews',
    '/reports',
    '/settings',
  ];

  for (const route of protectedRoutes) {
    test(`${route} should redirect to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
