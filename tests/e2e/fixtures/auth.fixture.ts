import { test as base, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Fixtures
 * Provides authenticated context and test users for E2E tests
 */

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  authFile: string;
};

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Authenticate and save credentials to file
 */
async function globalLogin(page: Page, email: string, password: string) {
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Save session storage
  await page.context().storageState({ path: authFile });
}

/**
 * Base test with authenticated page fixture
 */
export const test = base.extend<AuthFixtures>({
  authFile: authFile,

  authenticatedPage: async ({ browser, authFile }, use) => {
    // Check if auth file exists
    const fs = require('fs').promises;
    let storageState = undefined;

    try {
      const authFileData = await fs.readFile(authFile, 'utf-8');
      storageState = JSON.parse(authFileData);
    } catch (error) {
      // Auth file doesn't exist, will login fresh
    }

    // Create new context with stored credentials if available
    const context = await browser.newContext(
      storageState ? { storageState } : {}
    );
    const page = await context.newPage();

    // If no stored credentials, login fresh
    if (!storageState) {
      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'Test@Password123';

      try {
        await globalLogin(page, testEmail, testPassword);
      } catch (error) {
        console.error('Failed to login:', error);
        // Continue anyway - might fail at different point
      }
    }

    // Use the page
    await use(page);

    // Cleanup
    await context.close();
  },

  adminPage: async ({ browser, authFile }, use) => {
    const fs = require('fs').promises;
    let storageState = undefined;

    try {
      const authFileData = await fs.readFile(authFile, 'utf-8');
      storageState = JSON.parse(authFileData);
    } catch (error) {
      // Auth file doesn't exist
    }

    const context = await browser.newContext(
      storageState ? { storageState } : {}
    );
    const page = await context.newPage();

    // If no stored credentials, login as admin
    if (!storageState) {
      const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
      const adminPassword =
        process.env.TEST_ADMIN_PASSWORD || 'AdminPassword@123';

      try {
        await globalLogin(page, adminEmail, adminPassword);
      } catch (error) {
        console.error('Failed to login as admin:', error);
      }
    }

    await use(page);
    await context.close();
  },
});

export { expect };

/**
 * Helper functions for authentication tests
 */

/**
 * Login user by email and password
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  try {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation or error message
    await Promise.race([
      page.waitForURL(/.*dashboard/, { timeout: 5000 }),
      page.waitForSelector('[role="alert"]', { timeout: 5000 }),
    ]);

    // Check if still on login page (failed)
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch (error) {
    return false;
  }
}

/**
 * Logout user
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    // Click user menu (usually in header)
    await page.click('[data-testid="user-menu"]');

    // Click logout button
    await page.click('[data-testid="logout-btn"]');

    // Wait for redirect to login
    await page.waitForURL(/.*login/, { timeout: 5000 });
  } catch (error) {
    // Try alternative logout method
    try {
      await page.goto('/logout');
      await page.waitForURL(/.*login/, { timeout: 5000 });
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch (error) {
    return false;
  }
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Fill form field by name
 */
export async function fillFormField(
  page: Page,
  fieldName: string,
  value: string
): Promise<void> {
  const selector = `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`;
  await page.fill(selector, value);
}

/**
 * Submit form by button text
 */
export async function submitForm(
  page: Page,
  buttonText: string = 'Submit'
): Promise<void> {
  await page.click(`button:has-text("${buttonText}")`);
}

/**
 * Verify alert/notification message
 */
export async function verifyAlert(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'warning' = 'success'
): Promise<void> {
  const alertSelector = `[role="alert"]:has-text("${message}")`;
  await expect(page.locator(alertSelector)).toBeVisible({ timeout: 5000 });
}

/**
 * Take screenshot for debugging
 */
export async function debugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
}

/**
 * Get test data
 */
export function getTestData() {
  return {
    user: {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Test@Password123',
      firstName: 'Test',
      lastName: 'User',
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword@123',
    },
    asset: {
      name: `Test Asset ${Date.now()}`,
      type: 'TREATMENT_PLANT',
      location: 'Auckland, NZ',
    },
    dwsp: {
      name: `Test DWSP ${Date.now()}`,
      description: 'Test drinking water safety plan',
    },
  };
}
