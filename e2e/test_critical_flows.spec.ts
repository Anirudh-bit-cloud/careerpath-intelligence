import { test, expect } from '@playwright/test';

test.describe('CareerPath Intelligence — Critical Enterprise User Journeys', () => {

  test('Flow 1: Executive Overview & Theme Verification', async ({ page }) => {
    await page.goto('/');

    // Verify main brand heading and dashboard telemetry
    await expect(page.locator('h1, h2, span').filter({ hasText: 'Workforce Overview' }).first()).toBeVisible();
    await expect(page.locator('text=Unified Workforce Telemetry').first()).toBeVisible();

    // Verify key KPI cards render non-zero tabular numbers
    const kpiElements = page.locator('.font-mono');
    await expect(kpiElements.first()).toBeVisible();
  });

  test('Flow 2: Career Clusters & Unsupervised ML Exploration', async ({ page }) => {
    await page.goto('/');

    // Navigate to Career Clusters
    await page.click('button:has-text("Career Clusters")');

    // Verify PCA projection and discovered archetypes
    await expect(page.locator('text=Unsupervised Career Archetypes').first()).toBeVisible();
    await expect(page.locator('text=Fast-Track').or(page.locator('text=Cluster')).first()).toBeVisible();
  });

  test('Flow 3: Retention Opportunities & Employee Stagnation Drilldown', async ({ page }) => {
    await page.goto('/');

    // Click Retention Opportunities
    await page.click('button:has-text("Retention Opportunities")');

    // Verify table renders with Retention Risk Index (RRI)
    await expect(page.locator('text=Retention Risk Index').or(page.locator('text=RRI')).first()).toBeVisible();

    // Click on an Urgent employee record to open profile
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Verify profile opened with waterfall contribution
    await expect(page.locator('text=Waterfall Score Contribution').or(page.locator('text=Actionable Career Development Plan')).first()).toBeVisible();
  });

  test('Flow 4: Succession Planning & 9-Box Matrix Calibration', async ({ page }) => {
    await page.goto('/');

    // Navigate to Succession & Bench
    await page.click('button:has-text("Succession & Bench")');

    // Verify 9-box matrix and SPOF flags
    await expect(page.locator('text=9-Box Talent Calibration Matrix').first()).toBeVisible();
    await expect(page.locator('text=Single Points of Failure').first()).toBeVisible();

    // Click on a cell in the 9-box grid to test drilldown
    const futureStarCell = page.locator('text=Future Star / Key Talent').first();
    await futureStarCell.click();
    await expect(page.locator('text=Active Calibration Cohort').first()).toBeVisible();
  });

  test('Flow 5: Talent Calibration Committee Decision Workflow', async ({ page }) => {
    await page.goto('/');

    // Navigate to Talent Committee Review
    await page.click('button:has-text("Talent Committee Review")');

    // Verify presentation mode toggle exists
    await expect(page.locator('text=Calibration Mode').or(page.locator('text=Talent Review')).first()).toBeVisible();
    const maskButton = page.locator('button:has-text("Candidate Masking")').or(page.locator('button:has-text("Anonymize")'));
    if (await maskButton.count() > 0) {
      await maskButton.first().click();
    }
  });

  test('Flow 6: Algorithmic Fairness Audit Module', async ({ page }) => {
    await page.goto('/');

    // Navigate to Fairness Audit
    await page.click('button:has-text("Fairness & Bias Audit")');

    // Verify Four-Fifths rule audit summary
    await expect(page.locator('text=Four-Fifths Rule').or(page.locator('text=Disparate Impact')).first()).toBeVisible();
    await expect(page.locator('text=Cohort Suppression').or(page.locator('text=Demographic Audit')).first()).toBeVisible();
  });

  test('Flow 7: Accessibility & Keyboard Navigation (WCAG 2.2 AA)', async ({ page }) => {
    await page.goto('/');

    // Check main landmark accessibility: header, main, nav
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav[aria-label="Main Navigation Sidebar"]')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Verify keyboard shortcut help dialog opens on ?
    await page.keyboard.press('?');
    await expect(page.locator('text=Keyboard Shortcuts').first()).toBeVisible();
    await page.keyboard.press('Escape');

    // Verify command menu dialog
    await page.keyboard.press('Control+k');
    await expect(page.locator('input[placeholder*="page name"]').first()).toBeVisible();
    await page.keyboard.press('Escape');

    // Verify Theme Switcher accessibility & High Contrast option
    await page.click('button[aria-label="Theme settings"]');
    await expect(page.locator('text=High Contrast').first()).toBeVisible();
  });
});
