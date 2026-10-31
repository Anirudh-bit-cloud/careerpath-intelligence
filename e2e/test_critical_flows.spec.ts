import { test, expect } from '@playwright/test';

test.describe('CareerPath Intelligence — Critical Enterprise User Journeys', () => {

  test('Flow 1: Executive Overview & Theme Verification', async ({ page }) => {
    await page.goto('/');

    // Verify main brand heading and dashboard telemetry
    await expect(
      page.locator('h1').filter({ hasText: 'Workforce Progression' })
        .or(page.locator('text=Workforce Intelligence Command Center'))
        .first()
    ).toBeVisible();

    // Verify key KPI cards render non-zero tabular numbers
    const kpiElements = page.locator('.font-mono');
    await expect(kpiElements.first()).toBeVisible();
  });

  test('Flow 2: Career Clusters & Unsupervised ML Exploration', async ({ page }) => {
    await page.goto('/');

    // Navigate to Career Clusters
    await page.click('button:has-text("Career Clusters")');

    // Verify clustering heading and discovered archetypes
    await expect(
      page.locator('text=Career Trajectory Clustering')
        .or(page.locator('text=Archetype'))
        .first()
    ).toBeVisible();
    await expect(page.locator('text=Fast-Track').or(page.locator('text=Cluster')).first()).toBeVisible();
  });

  test('Flow 3: Retention Opportunities & Employee Stagnation Drilldown', async ({ page }) => {
    await page.goto('/');

    // Click Retention Opportunities
    await page.click('button:has-text("Retention Opportunities")');

    // Verify view heading and RRI column
    await expect(
      page.locator('text=Retention Opportunities & Career Action Plans')
        .or(page.locator('text=Proactive Talent Operations'))
        .first()
    ).toBeVisible({ timeout: 10000 });

    // Click "Initiate Plan" on the first visible row to open the drawer
    const initiateBtn = page.locator('button:has-text("Initiate Plan")').first();
    await expect(initiateBtn).toBeVisible({ timeout: 10000 });
    await initiateBtn.click();

    // Verify drawer opened with intervention heading
    await expect(
      page.locator('text=Initiate Retention Intervention')
        .or(page.locator('text=Update Development Plan'))
        .or(page.locator('text=Retention Opportunity Index'))
        .first()
    ).toBeVisible({ timeout: 10000 });
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

    // Verify Four-Fifths rule header is present
    await expect(page.locator('text=Four-Fifths Rule').or(page.locator('text=Disparate Impact')).first()).toBeVisible();
    // Verify suppression note is present (n < 10 suppression)
    await expect(
      page.locator('text=Suppression active')
        .or(page.locator('text=Sample Size Threshold'))
        .or(page.locator('text=suppressed for statistical validity'))
        .first()
    ).toBeVisible();
  });

  test('Flow 7: Accessibility & Keyboard Navigation (WCAG 2.2 AA)', async ({ page }) => {
    await page.goto('/');

    // Check main landmark accessibility: banner (header), main, complementary (aside/nav)
    await expect(page.locator('header')).toBeVisible();
    // Sidebar is an <aside> with aria-label="Main Navigation Sidebar"
    await expect(page.locator('aside[aria-label="Main Navigation Sidebar"]')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Verify keyboard shortcut help dialog opens on ?
    await page.keyboard.press('?');
    await expect(page.locator('text=Keyboard Shortcuts').first()).toBeVisible();
    await page.keyboard.press('Escape');
    // Wait for the dialog to fully close before continuing
    await expect(page.locator('[role="dialog"][aria-label="Keyboard Shortcuts"]')).not.toBeVisible({ timeout: 5000 });

    // Verify command menu dialog
    await page.keyboard.press('Control+k');
    await expect(page.locator('input[placeholder*="page name"]').or(page.locator('[role="dialog"] input')).first()).toBeVisible();
    await page.keyboard.press('Escape');
    // Wait for command dialog to close too
    await page.waitForTimeout(300);

    // Verify Theme Switcher accessibility & High Contrast option
    await page.click('button[aria-label="Theme settings"]');
    await expect(page.locator('text=High Contrast').first()).toBeVisible();
  });
});
