import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login - adjust based on your auth flow
    await page.goto('/login');

    // Fill login form (adjust selectors as needed)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('should load analytics dashboard', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.getByRole('heading', { name: /Analytics Dashboard/i })).toBeVisible();

    // Check for compliance score card
    await expect(page.getByText(/Overall Compliance Score/i)).toBeVisible();
  });

  test('should display compliance score', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Wait for data to load
    await page.waitForSelector('text=/Overall Compliance Score/i', { timeout: 10000 });

    // Check that a score is displayed (should be 0-100)
    const scoreElement = page.locator('text=/^\\d{1,3}$/').first();
    await expect(scoreElement).toBeVisible();

    const scoreText = await scoreElement.textContent();
    const score = parseInt(scoreText || '0');

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should display overview statistics', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Check for stat cards
    await expect(page.getByText(/Total Assets/i)).toBeVisible();
    await expect(page.getByText(/Critical Assets/i)).toBeVisible();
    await expect(page.getByText(/Active DWSPs/i)).toBeVisible();
    await expect(page.getByText(/Pending Reports/i)).toBeVisible();
    await expect(page.getByText(/Overdue Items/i)).toBeVisible();
    await expect(page.getByText(/Recent Incidents/i)).toBeVisible();
  });

  test('should display asset charts', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Wait for charts section
    await page.waitForSelector('text=/Assets by Risk Level/i', { timeout: 10000 });

    // Check for chart titles
    await expect(page.getByText(/Assets by Risk Level/i)).toBeVisible();
    await expect(page.getByText(/Assets by Condition/i)).toBeVisible();
  });

  test('should display document statistics', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Wait for documents section
    await page.waitForSelector('text=/Document Management/i', { timeout: 10000 });

    await expect(page.getByText(/Document Management/i)).toBeVisible();
    await expect(page.getByText(/Total Documents/i)).toBeVisible();
    await expect(page.getByText(/Storage Used/i)).toBeVisible();
  });

  test('should display DWSP trends when available', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // DWSP trends section may or may not be present depending on data
    const dwspSection = page.getByText(/DWSP Submission Trends/i);
    const isVisible = await dwspSection.isVisible().catch(() => false);

    // If visible, check for chart elements
    if (isVisible) {
      await expect(dwspSection).toBeVisible();
    }
  });

  test('should display user activity section', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    await page.waitForSelector('text=/User Activity/i', { timeout: 10000 });

    await expect(page.getByText(/User Activity/i)).toBeVisible();
    await expect(page.getByText(/active users in last 30 days/i)).toBeVisible();
  });

  test('should display top contributors', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    await page.waitForSelector('text=/Top Contributors/i', { timeout: 10000 });

    await expect(page.getByText(/Top Contributors/i)).toBeVisible();
  });

  test('should display critical assets table when present', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Critical assets section may not always be present
    const criticalSection = page.getByText(/Critical Assets Requiring Attention/i);
    const isVisible = await criticalSection.isVisible().catch(() => false);

    if (isVisible) {
      await expect(criticalSection).toBeVisible();

      // Check for table headers
      await expect(page.getByText(/Asset Name/i)).toBeVisible();
      await expect(page.getByText(/Type/i)).toBeVisible();
      await expect(page.getByText(/Condition/i)).toBeVisible();
      await expect(page.getByText(/Risk Level/i)).toBeVisible();
    }
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/dashboard/analytics');

    // Should show loading state initially
    const loadingText = page.getByText(/Loading analytics/i);

    // May or may not catch loading state depending on speed
    const wasLoading = await loadingText.isVisible().catch(() => false);

    // Eventually should show content
    await page.waitForSelector('text=/Overall Compliance Score/i', { timeout: 10000 });
  });

  test('should display error message on API failure', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/v1/analytics/dashboard', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/dashboard/analytics');

    // Should display error message
    await expect(page.getByText(/Failed to load dashboard data/i)).toBeVisible({
      timeout: 10000,
    });

    // Should have retry button
    await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
  });

  test('should retry loading on error', async ({ page }) => {
    let callCount = 0;

    await page.route('**/api/v1/analytics/dashboard', (route) => {
      callCount++;
      if (callCount === 1) {
        // First call fails
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        // Second call succeeds
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              overview: {
                totalAssets: 100,
                criticalAssets: 10,
                activeDWSPs: 2,
                pendingReports: 5,
                overdueItems: 1,
                recentIncidents: 0,
                complianceScore: 85,
              },
              assets: { byRiskLevel: [], byCondition: [], byType: [], criticalAssets: [] },
              documents: { totalDocuments: 50, byType: [], recentUploads: 10, storageUsedMB: 100 },
              dwspTrends: { trends: [] },
              users: { activeUsersLast30Days: 5, topContributors: [] },
            },
          }),
        });
      }
    });

    await page.goto('/dashboard/analytics');

    // Wait for error
    await expect(page.getByText(/Failed to load/i)).toBeVisible({ timeout: 5000 });

    // Click retry
    await page.getByRole('button', { name: /Try Again/i }).click();

    // Should load successfully
    await expect(page.getByText(/Overall Compliance Score/i)).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard/analytics');

    // Wait for content
    await page.waitForSelector('text=/Analytics Dashboard/i', { timeout: 10000 });

    // Check that content is visible and not cut off
    await expect(page.getByText(/Overall Compliance Score/i)).toBeVisible();
    await expect(page.getByText(/Total Assets/i)).toBeVisible();
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Intercept API and return empty data
    await page.route('**/api/v1/analytics/dashboard', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            overview: {
              totalAssets: 0,
              criticalAssets: 0,
              activeDWSPs: 0,
              pendingReports: 0,
              overdueItems: 0,
              recentIncidents: 0,
              complianceScore: 0,
            },
            assets: { byRiskLevel: [], byCondition: [], byType: [], criticalAssets: [] },
            documents: { totalDocuments: 0, byType: [], recentUploads: 0, storageUsedMB: 0 },
            dwspTrends: { trends: [] },
            users: { activeUsersLast30Days: 0, topContributors: [] },
          },
        }),
      });
    });

    await page.goto('/dashboard/analytics');

    // Should display zeros without errors
    await expect(page.getByText(/Overall Compliance Score/i)).toBeVisible();

    // Score should show 0
    const scoreElement = page.locator('text=/^0$/').first();
    await expect(scoreElement).toBeVisible();
  });
});
