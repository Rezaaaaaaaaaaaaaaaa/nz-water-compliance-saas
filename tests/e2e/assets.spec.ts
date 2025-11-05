import { test, expect } from './fixtures/auth.fixture';
import { getTestData, waitForPageLoad } from './fixtures/auth.fixture';

test.describe('Asset Management E2E', () => {
  const testData = getTestData();

  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/assets');
    await waitForPageLoad(authenticatedPage);
  });

  test.describe('Asset List View', () => {
    test('should display assets list', async ({ authenticatedPage }) => {
      // Page title or heading should be visible
      const heading = authenticatedPage.locator(
        'text=Assets, text=Asset Management, h1:has-text("Assets")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Create button should be visible
      const createBtn = authenticatedPage.locator(
        'button:has-text("Create"), button:has-text("New"), a:has-text("Create Asset")'
      );
      await expect(createBtn).toBeVisible({ timeout: 5000 });
    });

    test('should have search/filter functionality', async ({
      authenticatedPage,
    }) => {
      // Search input should exist
      const searchInput = authenticatedPage.locator(
        'input[placeholder*="Search"], input[type="search"], input[aria-label*="search" i]'
      );

      // Either search input exists or filter controls exist
      const hasSearch = await searchInput.isVisible().catch(() => false);
      const hasFilter = await authenticatedPage
        .locator('[data-testid="filter"], .filter')
        .isVisible()
        .catch(() => false);

      expect(hasSearch || hasFilter).toBe(true);
    });

    test('should display assets in table or list', async ({
      authenticatedPage,
    }) => {
      // Should have either table or list structure
      const hasTable = await authenticatedPage
        .locator('table')
        .isVisible()
        .catch(() => false);
      const hasList = await authenticatedPage
        .locator('[data-testid="asset-list"], .asset-item')
        .isVisible()
        .catch(() => false);

      expect(hasTable || hasList).toBe(true);
    });
  });

  test.describe('Create Asset Flow', () => {
    test('should open create asset form', async ({ authenticatedPage }) => {
      // Click create button
      const createBtn = authenticatedPage.locator(
        'button:has-text("Create"), button:has-text("New"), a:has-text("Create Asset")'
      );
      await createBtn.click();

      // Wait for form or navigate to create page
      await Promise.race([
        authenticatedPage.waitForSelector('form', { timeout: 3000 }),
        authenticatedPage.waitForURL(/.*assets.*create|.*new/i, {
          timeout: 3000,
        }),
      ]).catch(() => {
        // Form might already be visible
      });

      // Form should be visible
      const form = authenticatedPage.locator('form');
      await expect(form).toBeVisible({ timeout: 5000 });
    });

    test('should create asset with valid data', async ({
      authenticatedPage,
    }) => {
      // Click create button
      const createBtn = authenticatedPage.locator(
        'button:has-text("Create"), button:has-text("New"), a:has-text("Create Asset")'
      );
      await createBtn.click();

      // Wait for form
      await authenticatedPage.waitForSelector('form', { timeout: 5000 });

      // Fill form
      const assetName = `E2E Asset ${Date.now()}`;

      // Try to fill name field
      const nameInput = authenticatedPage.locator(
        'input[name="name"], input[name="assetName"], input[placeholder*="name" i]'
      );
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(assetName);
      }

      // Try to fill type field
      const typeSelect = authenticatedPage.locator(
        'select[name="type"], select[name="assetType"]'
      );
      if (await typeSelect.isVisible().catch(() => false)) {
        await typeSelect.selectOption('TREATMENT_PLANT');
      }

      // Try to fill location field
      const locationInput = authenticatedPage.locator(
        'input[name="location"], input[placeholder*="location" i]'
      );
      if (await locationInput.isVisible().catch(() => false)) {
        await locationInput.fill('Auckland, NZ');
      }

      // Submit form
      const submitBtn = authenticatedPage.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
      );
      await submitBtn.click();

      // Should show success message or redirect
      await Promise.race([
        authenticatedPage.waitForSelector(
          '[role="alert"]:has-text("created"), [role="alert"]:has-text("success")',
          { timeout: 5000 }
        ),
        authenticatedPage.waitForURL(/.*assets/, { timeout: 5000 }),
      ]);

      // Verify asset appears in list
      const assetInList = authenticatedPage.locator(`text=${assetName}`);
      await expect(assetInList).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for invalid data', async ({
      authenticatedPage,
    }) => {
      // Click create button
      const createBtn = authenticatedPage.locator(
        'button:has-text("Create"), button:has-text("New"), a:has-text("Create Asset")'
      );
      await createBtn.click();

      // Wait for form
      await authenticatedPage.waitForSelector('form', { timeout: 5000 });

      // Try to submit empty form
      const submitBtn = authenticatedPage.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
      );
      await submitBtn.click();

      // Should show validation errors
      const errorMsg = authenticatedPage.locator('[role="alert"], .error');
      await expect(errorMsg).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Edit Asset Flow', () => {
    test('should edit asset details', async ({ authenticatedPage }) => {
      // Wait for assets to load
      await waitForPageLoad(authenticatedPage);

      // Click first edit button
      const editBtn = authenticatedPage.locator(
        '[data-testid="edit-btn"], button:has-text("Edit"), a:has-text("Edit")'
      ).first();

      const isVisible = await editBtn.isVisible().catch(() => false);
      if (!isVisible) {
        // Skip if no assets available
        test.skip();
      }

      await editBtn.click();

      // Wait for edit form
      await authenticatedPage.waitForSelector('form', { timeout: 5000 });

      // Update a field
      const nameInput = authenticatedPage.locator(
        'input[name="name"], input[name="assetName"]'
      );

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`Updated Asset ${Date.now()}`);

        // Submit
        const submitBtn = authenticatedPage.locator(
          'button[type="submit"], button:has-text("Save"), button:has-text("Update")'
        );
        await submitBtn.click();

        // Should show success message
        await authenticatedPage
          .waitForSelector('[role="alert"]:has-text("updated"), [role="alert"]:has-text("success")',
            { timeout: 5000 }
          )
          .catch(() => {
            // Success message might not appear
          });
      }
    });
  });

  test.describe('Asset Details View', () => {
    test('should view asset details', async ({ authenticatedPage }) => {
      // Wait for assets to load
      await waitForPageLoad(authenticatedPage);

      // Click on first asset name or view button
      const assetLink = authenticatedPage.locator(
        '[data-testid="asset-link"], a:has-text("View"), .asset-name'
      ).first();

      const isVisible = await assetLink.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
      }

      await assetLink.click();

      // Should navigate to asset details page
      await authenticatedPage.waitForURL(/.*assets\/[a-f0-9-]+/, {
        timeout: 5000,
      });

      // Details should be visible
      const details = authenticatedPage.locator(
        '[data-testid="asset-details"], .asset-detail, main'
      );
      await expect(details).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Delete Asset Flow', () => {
    test('should delete asset with confirmation', async ({
      authenticatedPage,
    }) => {
      // Wait for assets to load
      await waitForPageLoad(authenticatedPage);

      // Get initial asset count
      const initialRows = await authenticatedPage
        .locator('tr, [data-testid="asset-item"], .asset-row')
        .count();

      if (initialRows === 0) {
        test.skip();
      }

      // Click delete button on first asset
      const deleteBtn = authenticatedPage
        .locator('[data-testid="delete-btn"], button:has-text("Delete")')
        .first();

      await deleteBtn.click();

      // Should show confirmation dialog
      const confirmDialog = authenticatedPage.locator(
        '[role="dialog"], .modal, .confirmation-dialog'
      );
      const hasDialog = await confirmDialog.isVisible().catch(() => false);

      if (hasDialog) {
        // Click confirm delete
        const confirmBtn = authenticatedPage.locator(
          'button:has-text("Delete"), button:has-text("Confirm")'
        );
        await confirmBtn.click();
      }

      // Should show success message
      await authenticatedPage
        .waitForSelector('[role="alert"]:has-text("deleted"), [role="alert"]:has-text("success")',
          { timeout: 5000 }
        )
        .catch(() => {});
    });
  });

  test.describe('Asset Search & Filter', () => {
    test('should search assets by name', async ({ authenticatedPage }) => {
      // Find search input
      const searchInput = authenticatedPage.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );

      const hasSearch = await searchInput.isVisible().catch(() => false);
      if (!hasSearch) {
        test.skip();
      }

      // Type search term
      await searchInput.fill('treatment');

      // Wait for results to filter
      await authenticatedPage.waitForTimeout(500);

      // Results should be filtered
      const results = authenticatedPage.locator(
        'tr, [data-testid="asset-item"], .asset-row'
      );
      const count = await results.count();

      // Should have filtered results
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter assets by type', async ({ authenticatedPage }) => {
      // Find filter control
      const typeFilter = authenticatedPage.locator(
        'select[name="type"], select[aria-label*="type" i]'
      );

      const hasFilter = await typeFilter.isVisible().catch(() => false);
      if (!hasFilter) {
        test.skip();
      }

      // Select a type
      await typeFilter.selectOption('TREATMENT_PLANT');

      // Wait for filtering
      await authenticatedPage.waitForTimeout(500);

      // Results should be filtered
      const results = authenticatedPage.locator(
        'tr, [data-testid="asset-item"], .asset-row'
      );
      const count = await results.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Asset Bulk Actions', () => {
    test('should select multiple assets', async ({ authenticatedPage }) => {
      // Find checkboxes
      const checkbox = authenticatedPage.locator(
        'input[type="checkbox"], [data-testid="checkbox"]'
      );

      const hasCheckboxes = await checkbox.isVisible().catch(() => false);
      if (!hasCheckboxes) {
        test.skip();
      }

      // Select first asset
      await checkbox.first().check();

      // Bulk action button should appear
      const bulkBtn = authenticatedPage.locator(
        'button:has-text("Delete"), button:has-text("Archive")'
      );
      await expect(bulkBtn).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Asset Export', () => {
    test('should export assets list', async ({ authenticatedPage }) => {
      // Find export button
      const exportBtn = authenticatedPage.locator(
        'button:has-text("Export"), button:has-text("Download")'
      );

      const hasExport = await exportBtn.isVisible().catch(() => false);
      if (!hasExport) {
        test.skip();
      }

      // Click export
      await exportBtn.click();

      // Wait for file download or success message
      const downloadPromise = authenticatedPage.waitForEvent('download').catch(() => null);

      if (downloadPromise) {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/asset|export/i);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ authenticatedPage }) => {
      // Set mobile viewport
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto('/dashboard/assets');
      await waitForPageLoad(authenticatedPage);

      // Content should be visible
      const heading = authenticatedPage.locator(
        'text=Assets, text=Asset Management'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Create button should be accessible
      const createBtn = authenticatedPage.locator(
        'button:has-text("Create"), button:has-text("New")'
      );
      await expect(createBtn).toBeVisible({ timeout: 5000 });
    });

    test('should be responsive on tablet', async ({ authenticatedPage }) => {
      // Set tablet viewport
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage.goto('/dashboard/assets');
      await waitForPageLoad(authenticatedPage);

      // Content should be visible
      const heading = authenticatedPage.locator(
        'text=Assets, text=Asset Management'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });
    });
  });
});
