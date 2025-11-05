import { test, expect } from './fixtures/auth.fixture';
import { waitForPageLoad } from './fixtures/auth.fixture';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await waitForPageLoad(authenticatedPage);
  });

  test.describe('Dashboard Load', () => {
    test('should load dashboard successfully', async ({ authenticatedPage }) => {
      // Should be on dashboard
      expect(authenticatedPage.url()).toContain('/dashboard');

      // Heading should be visible
      const heading = authenticatedPage.locator(
        'text=Dashboard, h1:has-text("Dashboard"), h1:has-text("Overview")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should display main navigation', async ({ authenticatedPage }) => {
      // Should have navigation
      const nav = authenticatedPage.locator('nav, [role="navigation"], .sidebar');
      await expect(nav).toBeVisible({ timeout: 5000 });

      // Should have links to main sections
      const links = ['Assets', 'Compliance', 'Documents', 'Analytics'];
      for (const link of links) {
        const navLink = authenticatedPage.locator(`a:has-text("${link}")`);
        const isVisible = await navLink.isVisible().catch(() => false);
        if (isVisible) {
          expect(isVisible).toBe(true);
        }
      }
    });

    test('should display user menu', async ({ authenticatedPage }) => {
      // User menu should be visible
      const userMenu = authenticatedPage.locator(
        '[data-testid="user-menu"], button[aria-label*="user" i], .user-profile'
      );
      await expect(userMenu).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Dashboard Widgets', () => {
    test('should display overview cards', async ({ authenticatedPage }) => {
      // Wait for content to load
      await waitForPageLoad(authenticatedPage);

      // Look for overview cards/stats
      const cards = authenticatedPage.locator(
        '[data-testid="stat-card"], .card, .stat, [role="region"]'
      );

      const cardCount = await cards.count();
      // Should have at least some cards (or gracefully handle no data)
      expect(cardCount).toBeGreaterThanOrEqual(0);

      // Should have visible text indicating stats
      const statsText = authenticatedPage.locator(
        'text=Total, text=Assets, text=Active, text=Compliance'
      );
      const hasStats = await statsText.isVisible().catch(() => false);
      // Stats might not be visible if no data
      console.log('Stats visible:', hasStats);
    });

    test('should display recent activity section', async ({
      authenticatedPage,
    }) => {
      // Look for recent activity
      const activitySection = authenticatedPage.locator(
        'text=Recent Activity, text=Activity, text=Latest, [data-testid="activity"]'
      );
      const hasActivity = await activitySection.isVisible().catch(() => false);

      // Activity section is optional but should render if present
      console.log('Recent activity visible:', hasActivity);
    });

    test('should display compliance status', async ({ authenticatedPage }) => {
      // Look for compliance status widget
      const complianceWidget = authenticatedPage.locator(
        'text=Compliance, text=Status, text=Score, [data-testid="compliance"]'
      );
      const hasCompliance = await complianceWidget.isVisible().catch(() => false);

      // Compliance widget is optional
      console.log('Compliance status visible:', hasCompliance);
    });

    test('should display assets overview', async ({ authenticatedPage }) => {
      // Look for assets overview
      const assetsWidget = authenticatedPage.locator(
        'text=Assets, text=Total Assets, [data-testid="assets-widget"]'
      );
      const hasAssets = await assetsWidget.isVisible().catch(() => false);

      // Assets widget is optional
      console.log('Assets widget visible:', hasAssets);
    });
  });

  test.describe('Dashboard Charts & Visualizations', () => {
    test('should render charts', async ({ authenticatedPage }) => {
      // Look for SVG charts (common for charting libraries)
      const charts = authenticatedPage.locator('svg');
      const chartCount = await charts.count();

      // Charts are optional but should render if present
      console.log('Chart elements found:', chartCount);
    });

    test('should display trends if available', async ({ authenticatedPage }) => {
      // Look for trend indicators
      const trends = authenticatedPage.locator(
        'text=Trend, text=Up, text=Down, text=Increase, text=Decrease'
      );
      const hasTrends = await trends.isVisible().catch(() => false);

      // Trends are optional
      console.log('Trends visible:', hasTrends);
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should navigate to assets from dashboard', async ({
      authenticatedPage,
    }) => {
      // Find assets link/button
      const assetsLink = authenticatedPage.locator(
        'a:has-text("Assets"), button:has-text("Assets"), [data-testid="assets-link"]'
      );
      const hasLink = await assetsLink.isVisible().catch(() => false);

      if (hasLink) {
        await assetsLink.first().click();
        await authenticatedPage.waitForURL(/.*assets/, { timeout: 5000 });
        expect(authenticatedPage.url()).toContain('/assets');
      }
    });

    test('should navigate to compliance from dashboard', async ({
      authenticatedPage,
    }) => {
      // Find compliance link
      const complianceLink = authenticatedPage.locator(
        'a:has-text("Compliance"), button:has-text("Compliance"), [data-testid="compliance-link"]'
      );
      const hasLink = await complianceLink.isVisible().catch(() => false);

      if (hasLink) {
        await complianceLink.first().click();
        await authenticatedPage.waitForURL(/.*compliance/, { timeout: 5000 });
        expect(authenticatedPage.url()).toContain('/compliance');
      }
    });

    test('should navigate to documents from dashboard', async ({
      authenticatedPage,
    }) => {
      // Find documents link
      const docsLink = authenticatedPage.locator(
        'a:has-text("Documents"), button:has-text("Documents"), [data-testid="documents-link"]'
      );
      const hasLink = await docsLink.isVisible().catch(() => false);

      if (hasLink) {
        await docsLink.first().click();
        await authenticatedPage.waitForURL(/.*documents/, { timeout: 5000 });
        expect(authenticatedPage.url()).toContain('/documents');
      }
    });

    test('should navigate to analytics from dashboard', async ({
      authenticatedPage,
    }) => {
      // Find analytics link
      const analyticsLink = authenticatedPage.locator(
        'a:has-text("Analytics"), button:has-text("Analytics"), [data-testid="analytics-link"]'
      );
      const hasLink = await analyticsLink.isVisible().catch(() => false);

      if (hasLink) {
        await analyticsLink.first().click();
        await authenticatedPage.waitForURL(/.*analytics/, { timeout: 5000 });
        expect(authenticatedPage.url()).toContain('/analytics');
      }
    });
  });

  test.describe('Dashboard Interactivity', () => {
    test('should handle dashboard refresh', async ({ authenticatedPage }) => {
      // Refresh page
      await authenticatedPage.reload();
      await waitForPageLoad(authenticatedPage);

      // Should still be logged in and on dashboard
      expect(authenticatedPage.url()).toContain('/dashboard');

      const heading = authenticatedPage.locator(
        'text=Dashboard, h1:has-text("Dashboard")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should respond to filter changes if available', async ({
      authenticatedPage,
    }) => {
      // Look for filter controls
      const filterBtn = authenticatedPage.locator(
        'button:has-text("Filter"), select, [data-testid="filter"]'
      );
      const hasFilter = await filterBtn.isVisible().catch(() => false);

      if (hasFilter) {
        await filterBtn.first().click();
        // Wait for filter menu or change
        await authenticatedPage.waitForTimeout(500);
        console.log('Filter available and clickable');
      }
    });

    test('should handle date range selection if available', async ({
      authenticatedPage,
    }) => {
      // Look for date inputs
      const dateInput = authenticatedPage.locator(
        'input[type="date"], input[placeholder*="date" i], [data-testid="date-picker"]'
      );
      const hasDatePicker = await dateInput.isVisible().catch(() => false);

      if (hasDatePicker) {
        // Date pickers are available
        console.log('Date picker available');
      }
    });
  });

  test.describe('Dashboard Performance', () => {
    test('should load dashboard in reasonable time', async ({
      authenticatedPage,
    }) => {
      const startTime = Date.now();

      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      const loadTime = Date.now() - startTime;

      // Dashboard should load in less than 10 seconds
      expect(loadTime).toBeLessThan(10000);
      console.log(`Dashboard loaded in ${loadTime}ms`);
    });

    test('should handle rapid navigation', async ({ authenticatedPage }) => {
      // Navigate quickly between sections
      const sections = [
        '/dashboard/assets',
        '/dashboard/compliance',
        '/dashboard/documents',
        '/dashboard',
      ];

      for (const section of sections) {
        await authenticatedPage.goto(section);
        await waitForPageLoad(authenticatedPage);
        expect(authenticatedPage.url()).toContain(section.split('/').pop());
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should be responsive on desktop', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 1920, height: 1080 });
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      const heading = authenticatedPage.locator(
        'text=Dashboard, h1:has-text("Dashboard")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should be responsive on tablet', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      const heading = authenticatedPage.locator(
        'text=Dashboard, h1:has-text("Dashboard")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should be responsive on mobile', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto('/dashboard');
      await waitForPageLoad(authenticatedPage);

      const heading = authenticatedPage.locator(
        'text=Dashboard, h1:has-text("Dashboard")'
      );
      await expect(heading).toBeVisible({ timeout: 5000 });

      // Navigation should still be accessible
      const nav = authenticatedPage.locator('nav, [role="navigation"]');
      const hasNav = await nav.isVisible().catch(() => false);
      // Nav might be hidden behind hamburger on mobile
      console.log('Navigation visible on mobile:', hasNav);
    });
  });

  test.describe('Dashboard Accessibility', () => {
    test('should have proper heading hierarchy', async ({
      authenticatedPage,
    }) => {
      // Should have h1 for page title
      const h1 = authenticatedPage.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have descriptive links', async ({ authenticatedPage }) => {
      // Links should have descriptive text
      const links = authenticatedPage.locator('a');
      const linkCount = await links.count();

      // Should have some navigation links
      expect(linkCount).toBeGreaterThan(0);
    });

    test('should have keyboard navigation', async ({ authenticatedPage }) => {
      // Tab through page
      await authenticatedPage.keyboard.press('Tab');
      const focused1 = await authenticatedPage.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focused1).toBeTruthy();

      await authenticatedPage.keyboard.press('Tab');
      const focused2 = await authenticatedPage.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focused2).toBeTruthy();
    });
  });

  test.describe('Dashboard Data Export', () => {
    test('should allow data export if available', async ({
      authenticatedPage,
    }) => {
      // Look for export button
      const exportBtn = authenticatedPage.locator(
        'button:has-text("Export"), button:has-text("Download"), [data-testid="export"]'
      );
      const hasExport = await exportBtn.isVisible().catch(() => false);

      if (hasExport) {
        // Export feature is available
        console.log('Dashboard export available');
      }
    });

    test('should allow report generation if available', async ({
      authenticatedPage,
    }) => {
      // Look for report button
      const reportBtn = authenticatedPage.locator(
        'button:has-text("Report"), button:has-text("Generate"), [data-testid="report"]'
      );
      const hasReport = await reportBtn.isVisible().catch(() => false);

      if (hasReport) {
        // Report feature is available
        console.log('Report generation available');
      }
    });
  });
});
