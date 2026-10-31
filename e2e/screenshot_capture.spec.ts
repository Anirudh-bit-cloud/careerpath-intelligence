import { test } from '@playwright/test';
import path from 'path';

test('Capture full-resolution polished screenshots of all primary enterprise views', async ({ page }) => {
  const artifactDir = 'C:\\Users\\saini\\.gemini\\antigravity\\brain\\f1fea8a4-15d8-43d3-b2a8-06731ea80ac3';

  // 1. Overview
  await page.goto('/#/overview');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_1_overview.png') });

  // 2. Career Clusters
  await page.click('button:has-text("Career Clusters")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_2_clusters.png') });

  // 3. Promotion Gap Monitor
  await page.click('button:has-text("Promotion Gap Monitor")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_3_promotion_gap.png') });

  // 4. Workforce Trends (Populated)
  await page.click('button:has-text("Workforce Trends")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_trends_populated.png') });

  // 5. Retention Opportunities
  await page.click('button:has-text("Retention Opportunities")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_4_retention.png') });

  // 6. Fairness & Bias Audit
  await page.click('button:has-text("Fairness & Bias Audit")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_5_fairness.png') });

  // 7. Trust Center & Governance
  await page.click('button:has-text("Trust Center & Governance")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_6_trust_center.png') });
});
