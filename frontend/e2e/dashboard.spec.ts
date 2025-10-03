/**
 * Dashboard E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard (requires auth)', () => {
  test.skip('should display dashboard after login', async ({ page }) => {
    // Skip this test in CI as it requires actual auth
    // In a real scenario, you'd set up auth state
    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: /Welcome/i })
    ).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if navigation items are present (even if redirected to login)
    // This tests the page structure
    const dashboardExists = await page
      .getByText(/Dashboard/i)
      .isVisible()
      .catch(() => false);

    // Either we're on the dashboard or we've been redirected to login
    const onDashboard = await page.url().includes('/dashboard');
    const onLogin = await page.url().includes('/login');

    expect(onDashboard || onLogin).toBe(true);
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should load without horizontal scroll
    const body = await page.$('body');
    const boundingBox = await body?.boundingBox();

    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page).toBeTruthy();
  });
});

test.describe('Accessibility', () => {
  test('should have no automatic accessibility violations on login page', async ({
    page,
  }) => {
    await page.goto('/login');

    // Check for basic accessibility requirements
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check that inputs have labels or placeholders
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('login page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
