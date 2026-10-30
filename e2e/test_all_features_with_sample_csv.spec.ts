import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('End-to-End Enterprise Verification: Sample CSV Upload & All Views', () => {
  test.setTimeout(120000); // 2 minutes for complete traversal

  test('E2E Flow: Upload Sample CSV and verify all 16 enterprise views cleanly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => {
      console.log(`[PageError]: ${err.message}`);
      pageErrors.push(`[PageError]: ${err.message}`);
    });

    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('404')) {
        console.log(`[ConsoleError]: ${msg.text()}`);
        pageErrors.push(`[ConsoleError]: ${msg.text()}`);
      }
    });

    // ── 1. Initial Load & Overview ──────────────────────────────────────────
    console.log('--> STEP 1: Initial Load & Overview');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button:has-text("Workforce Overview")').first()).toBeVisible();
    await expect(page.locator('.font-mono').first()).toBeVisible();

    // ── 2. Data Management: Upload Sample CSV ───────────────────────────────
    console.log('--> STEP 2: Data Management');
    await page.click('button:has-text("Data Management")');
    await page.waitForTimeout(400);

    await expect(page.locator('h1:has-text("Dataset Management & ML Configuration")').first()).toBeVisible();

    // Set sample CSV
    const sampleCsvPath = path.resolve('data/uploads/careerpath_sample_hr_dataset.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleCsvPath);
    await page.waitForTimeout(200);

    // Verify ready status indicator
    await expect(page.locator('text=Ready').first()).toBeVisible();

    // Click Upload
    const uploadBtn = page.locator('button:has-text("Upload & Run Analytics Engine")');
    await uploadBtn.click();

    // Wait for upload completion message
    await expect(page.locator('text=Dataset uploaded and processed successfully').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=300').first()).toBeVisible();

    // ── 3. Career Clusters ──────────────────────────────────────────────────
    await page.click('button:has-text("Career Clusters")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Career Clusters').first()).toBeVisible();

    // ── 4. Promotion Gap Monitor ────────────────────────────────────────────
    await page.click('button:has-text("Promotion Gap Monitor")');
    await page.waitForTimeout(400);
    await expect(page.locator('table').first()).toBeVisible();

    // ── 5. Manager Insights ─────────────────────────────────────────────────
    await page.click('button:has-text("Manager Insights")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Manager Insights').first()).toBeVisible();

    // ── 6. Retention Opportunities & Stagnation Drawer ──────────────────────
    await page.click('button:has-text("Retention Opportunities")');
    await page.waitForTimeout(400);
    await expect(page.locator('table').first()).toBeVisible();

    // Click "Initiate Plan" on first row to open RetentionDrawer
    const initiateBtn = page.locator('button:has-text("Initiate Plan")').first();
    if (await initiateBtn.count() > 0) {
      await initiateBtn.click();
      await page.waitForTimeout(400);
      await expect(page.locator('h2:has-text("Initiate Retention Intervention")').or(page.locator('text=Initiate Retention Intervention')).first()).toBeVisible();

      // Close drawer
      const closeBtn = page.locator('button:has-text("Close drawer")').or(page.locator('button[aria-label="Close drawer"]')).or(page.locator('button:has-text("Cancel")'));
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(300);
    }

    // ── 7. Succession & Bench ───────────────────────────────────────────────
    await page.click('button:has-text("Succession & Bench")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=9-Box').first()).toBeVisible();

    // ── 8. Talent Committee Review ──────────────────────────────────────────
    await page.click('button:has-text("Talent Committee Review")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Talent Committee').first()).toBeVisible();

    // Test Candidate Masking toggle
    const maskBtn = page.locator('button:has-text("Candidate Masking")').or(page.locator('button:has-text("Anonymize")'));
    if (await maskBtn.count() > 0) {
      await maskBtn.first().click();
      await page.waitForTimeout(300);
      const exitMaskBtn = page.locator('button:has-text("Exit Masking")').or(page.locator('button:has-text("Presentation Mode")'));
      if (await exitMaskBtn.count() > 0) {
        await exitMaskBtn.first().click();
      }
    }

    // ── 9. Impact & ROI Estimator ───────────────────────────────────────────
    await page.click('button:has-text("Impact & ROI Estimator")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Impact').first()).toBeVisible();

    // Click Balanced Preset
    const balancedBtn = page.locator('button:has-text("Balanced")');
    if (await balancedBtn.count() > 0) {
      await balancedBtn.click();
      await page.waitForTimeout(200);
    }

    // ── 10. Employee Explorer ───────────────────────────────────────────────
    await page.click('button:has-text("Employee Explorer")');
    await page.waitForTimeout(400);
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();

    // ── 11. Reports & Briefings ─────────────────────────────────────────────
    await page.click('button:has-text("Reports & Briefings")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Reports & Briefings').first()).toBeVisible();

    // ── 12. Fairness & Bias Audit ───────────────────────────────────────────
    await page.click('button:has-text("Fairness & Bias Audit")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Four-Fifths').first()).toBeVisible();

    // ── 13. Trust Center & Governance ───────────────────────────────────────
    await page.click('button:has-text("Trust Center & Governance")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Trust Center').first()).toBeVisible();

    // ── 14. Connectors & Public API ─────────────────────────────────────────
    await page.click('button:has-text("Connectors & Public API")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Connectors').first()).toBeVisible();

    // ── 15. Design System & Tokens ──────────────────────────────────────────
    await page.click('button:has-text("Design System & Tokens")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Design System').first()).toBeVisible();

    // ── 16. Themes & Settings ───────────────────────────────────────────────
    await page.click('button:has-text("Themes & Settings")');
    await page.waitForTimeout(400);
    await expect(page.locator('text=Settings').first()).toBeVisible();

    // Switch between tabs in Settings (Validation, Notifications, Appearance)
    const valTab = page.locator('button:has-text("Validation")').or(page.locator('button:has-text("Model Validation")'));
    if (await valTab.count() > 0) {
      await valTab.first().click();
      await page.waitForTimeout(300);
    }

    const notifTab = page.locator('button:has-text("Notifications")');
    if (await notifTab.count() > 0) {
      await notifTab.first().click();
      await page.waitForTimeout(300);
    }

    const appTab = page.locator('button:has-text("Appearance")');
    if (await appTab.count() > 0) {
      await appTab.first().click();
      await page.waitForTimeout(300);
    }

    // ── 17. Keyboard Shortcuts (?) & Command Palette (Ctrl+K) ───────────────
    await page.keyboard.press('?');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Keyboard Shortcuts').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await expect(page.locator('input[placeholder*="page name"]').first()).toBeVisible();
    await page.keyboard.press('Escape');

    // ── Assert 0 runtime errors / page crashes ──────────────────────────────
    expect(pageErrors).toHaveLength(0);
  });
});
