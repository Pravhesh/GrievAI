import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000/app');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/GrievAI/);
});

test('connect wallet button is visible', async ({ page }) => {
    await page.goto('http://localhost:3000/app');

    // Find the connect wallet button
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
});
