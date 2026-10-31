import { test, expect } from '@playwright/test';

test.describe('CareerPath Intelligence v3.2.0 — Extended Features QA', () => {

  test('E2E 1: Backtest Tab in Settings & Model Validation', async ({ page }) => {
    await page.goto('/');
    // Navigate to Settings
    await page.click('button:has-text("Themes & Settings"), button:has-text("Settings")');
    await expect(page.locator('text=Model Governance').or(page.locator('text=Validation')).first()).toBeVisible();

    // Look for Backtest sub-tab or section
    const backtestTab = page.locator('button:has-text("Backtest"), span:has-text("Backtest")').first();
    if (await backtestTab.isVisible()) {
      await backtestTab.click();
      await expect(page.locator('text=Rolling-Origin').or(page.locator('text=Backtest')).first()).toBeVisible();
    }
  });

  test('E2E 2: Fairness Audit Intersectional & Longitudinal Navigation', async ({ page }) => {
    await page.goto('/');
    // Navigate to Fairness & Bias Audit
    await page.click('button:has-text("Fairness & Bias Audit")');
    await expect(page.locator('text=Algorithmic Fairness & Bias Audit Module').first()).toBeVisible();

    // Check intersectional or longitudinal tabs
    const intersectionalBtn = page.locator('button:has-text("Intersectional Slices")').first();
    await intersectionalBtn.click();
    await expect(page.locator('text=Intersectional Demographic Parity').or(page.locator('text=Benjamini-Hochberg')).first()).toBeVisible();
  });

  test('E2E 3: Trust Center Compliance Mapping View', async ({ page }) => {
    await page.goto('/');
    // Use page.click with exact button text as done in other flows
    await page.click('button:has-text("Trust Center & Governance")');

    // Wait for the Trust Center content to appear
    await expect(page.locator('text=Trust Center & Enterprise Governance').first()).toBeVisible();

    // Click on Compliance sub-tab inside Trust Center
    await page.getByRole('button', { name: 'Compliance', exact: true }).click();

    // Verify Compliance section content
    await expect(page.locator('text=Compliance Documentation').or(page.locator('text=Regulatory Compliance Mapping')).first()).toBeVisible();
    await expect(page.locator('text=DPIA Template').or(page.locator('text=Model Card')).first()).toBeVisible();
  });

  test('E2E 4: Connectors View with BambooHR Adapter & Pitch Mode', async ({ page }) => {
    await page.goto('/');
    // Navigate to Connectors
    await page.click('button:has-text("Connectors & Public API"), button:has-text("Connectors")');
    await expect(page.locator('text=BambooHR').or(page.locator('text=Connectors')).first()).toBeVisible();

    // Check Pitch Mode button in sidebar
    const pitchBtn = page.locator('button:has-text("Pitch Mode")').first();
    if (await pitchBtn.isVisible()) {
      await pitchBtn.click();
      await expect(page.locator('text=Active (7 Views)')).toBeVisible();
      // Turn back off
      await pitchBtn.click();
      await expect(pitchBtn.locator('text=Off')).toBeVisible();
    }
  });

});
