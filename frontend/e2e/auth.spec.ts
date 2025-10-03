/**
 * Authentication E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/NZ Water Compliance/);
    await expect(
      page.getByRole('heading', { name: /Sign In/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /register/i }).click();

    await expect(page).toHaveURL(/\/register/);
  });

  test('homepage should redirect unauthenticated users to login', async ({
    page,
  }) => {
    await page.goto('/');

    // Should eventually redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('should display Taumata Arowai branding', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText(/Taumata Arowai/i)).toBeVisible();
    await expect(
      page.getByText(/Regulatory Compliance Management/i)
    ).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/login');

    const title = await page.title();
    expect(title).toContain('NZ Water Compliance');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: /Sign In/i })
    ).toBeVisible();
  });
});
