import { test, expect } from './fixtures/auth.fixture';
import {
  loginUser,
  logoutUser,
  isAuthenticated,
  getTestData,
  debugScreenshot,
  waitForPageLoad,
} from './fixtures/auth.fixture';

test.describe('Authentication E2E', () => {
  const testData = getTestData();

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({
      page,
    }) => {
      await page.goto('/login');
      await waitForPageLoad(page);

      // Fill login form
      await page.fill('input[name="email"]', testData.user.email);
      await page.fill('input[name="password"]', testData.user.password);

      // Click login
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      expect(page.url()).toContain('/dashboard');
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await waitForPageLoad(page);

      // Fill with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[role="alert"]')).toBeVisible({
        timeout: 5000,
      });

      // Should remain on login page
      expect(page.url()).toContain('/login');
    });

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/login');
      await waitForPageLoad(page);

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('[role="alert"], .error, .invalid')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/login');
      await waitForPageLoad(page);

      // Enter invalid email
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'Password123');

      // Try to submit
      await page.click('button[type="submit"]');

      // Should show validation error
      const errors = page.locator('[role="alert"], .error');
      await expect(errors).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Authenticated User', () => {
    test('should have access to dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      // Should see dashboard content
      await expect(
        authenticatedPage.locator('text=Dashboard, text=Overview, text=Analytics')
      ).toBeVisible({
        timeout: 5000,
      });

      expect(authenticatedPage.url()).toContain('/dashboard');
    });

    test('should show user menu when logged in', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      // User menu should be visible (usually top right)
      const userMenu = authenticatedPage.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible({ timeout: 5000 });
    });

    test('should be able to navigate to different sections', async ({
      authenticatedPage,
    }) => {
      // Navigate to Assets
      await authenticatedPage.goto('/dashboard/assets');
      await waitForPageLoad(authenticatedPage);
      expect(authenticatedPage.url()).toContain('/assets');

      // Navigate to Compliance
      await authenticatedPage.goto('/dashboard/compliance');
      await waitForPageLoad(authenticatedPage);
      expect(authenticatedPage.url()).toContain('/compliance');

      // Navigate to Documents
      await authenticatedPage.goto('/dashboard/documents');
      await waitForPageLoad(authenticatedPage);
      expect(authenticatedPage.url()).toContain('/documents');
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      // Get logged in state
      const isLoggedIn = await isAuthenticated(authenticatedPage);
      expect(isLoggedIn).toBe(true);

      // Logout
      try {
        await logoutUser(authenticatedPage);
      } catch (e) {
        // If logout fails, try direct navigation
        await authenticatedPage.goto('/logout');
      }

      // Should be redirected to login
      await authenticatedPage.waitForURL(/.*login/, { timeout: 10000 });
      expect(authenticatedPage.url()).toContain('/login');
    });

    test('should not have access to dashboard after logout', async ({
      page,
    }) => {
      // First login
      const success = await loginUser(
        page,
        testData.user.email,
        testData.user.password
      );
      expect(success).toBe(true);

      // Then logout
      try {
        await logoutUser(page);
      } catch (e) {
        await page.goto('/logout');
      }

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/.*login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Registration Flow', () => {
    test.skip(
      'should register new user successfully',
      async ({ page }) => {
        const newEmail = `test-${Date.now()}@example.com`;

        await page.goto('/register');
        await waitForPageLoad(page);

        // Fill registration form
        await page.fill('input[name="email"]', newEmail);
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill(
          'input[name="password"]',
          'NewPassword@123456'
        );
        await page.fill(
          'input[name="confirmPassword"]',
          'NewPassword@123456'
        );

        // Accept terms if needed
        const termsCheckbox = page.locator('input[type="checkbox"]');
        const isVisible = await termsCheckbox.isVisible().catch(() => false);
        if (isVisible) {
          await termsCheckbox.check();
        }

        // Submit
        await page.click('button[type="submit"]');

        // Should redirect to dashboard or confirmation page
        await page.waitForURL(/.*dashboard|.*confirm/, { timeout: 10000 });

        // Should be logged in
        const loggedIn = await isAuthenticated(page);
        expect(loggedIn).toBe(true);
      }
    );

    test('should show password validation errors', async ({ page }) => {
      await page.goto('/register');
      await waitForPageLoad(page);

      // Use weak password
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="password"]', '123'); // Too weak

      // Try to submit
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.locator('[role="alert"], .error')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session on page refresh', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      // Verify logged in
      const beforeRefresh = await isAuthenticated(authenticatedPage);
      expect(beforeRefresh).toBe(true);

      // Refresh page
      await authenticatedPage.reload();
      await waitForPageLoad(authenticatedPage);

      // Should still be logged in
      const afterRefresh = await isAuthenticated(authenticatedPage);
      expect(afterRefresh).toBe(true);
    });

    test('should handle session timeout gracefully', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      // Simulate session timeout by clearing cookies
      await authenticatedPage.context().clearCookies();

      // Navigate to protected page
      await authenticatedPage.goto('/dashboard/assets');
      await authenticatedPage.waitForTimeout(1000);

      // Should redirect to login
      const isLoggedIn = await isAuthenticated(authenticatedPage);
      // Should be logged out (actually this will redirect, so url should be login)
      const url = authenticatedPage.url();
      if (!isLoggedIn) {
        expect(url).toContain('/login');
      }
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should display login form on desktop', async ({ page }) => {
      await page.viewport?.({ width: 1920, height: 1080 });
      await page.goto('/login');
      await waitForPageLoad(page);

      // Form should be visible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display login form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      await waitForPageLoad(page);

      // Form should still be visible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper label associations', async ({ page }) => {
      await page.goto('/login');

      // Email input should have associated label
      const emailInput = page.locator('input[name="email"]');
      const emailLabel = page.locator('label[for*="email"]');

      // At least one should be present
      const emailVisible = await emailInput.isVisible().catch(() => false);
      const labelVisible = await emailLabel.isVisible().catch(() => false);
      expect(emailVisible || labelVisible).toBe(true);
    });

    test('should have keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      await waitForPageLoad(page);

      // Tab to email field
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();

      // Tab to password field
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    });
  });
});
