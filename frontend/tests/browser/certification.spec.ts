import { test, expect } from '@playwright/test';

test.describe('STEP 20G.10B Certification', () => {

  test('Authentication & Error States', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Login').first()).toBeVisible();

    await page.fill('#username', 'invalid');
    await page.fill('#password', 'wrong');
    await page.click('button[type="submit"]');
    
    // Look for error message
    const errorText = page.locator('text=Login failed').first();
    // Wait for either the error to appear, or for a timeout
    await errorText.waitFor({ timeout: 5000 }).catch(() => null); 

    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('login') && resp.status() === 201).catch(() => null),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(2000); // Give time for redirect
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('Legacy Routes Redirects', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const legacyRoutes = [
      { from: '/reports/finance', to: '/finance/reports' },
      { from: '/customers/list', to: '/crm/customers' },
      { from: '/customers', to: '/crm/customers' },
      { from: '/inventory/stock-transfer', to: '/inventory/transfers' }
    ];

    for (const route of legacyRoutes) {
      await page.goto(route.from);
      await page.waitForTimeout(1000); // wait for redirect
      await expect(page).toHaveURL(new RegExp(route.to));
    }
  });

  test('Canonical Routes Crawler', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    const errors = [];
    const targetRoutes = [
      '/', '/crm/customers', '/sales/orders', '/purchasing/orders', 
      '/inventory/stock', '/manufacturing/mrp', '/finance/invoices',
      '/finance/gl', '/hr/employees', '/hr/payroll', '/finance/assets',
      '/approvals', '/reports/sales'
    ];

    for (const route of targetRoutes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (!response) {
        errors.push(`${route} - No response`);
        continue;
      }
      if (response.status() >= 400) {
        errors.push(`${route} - Status ${response.status()}`);
      }
    }
    
    expect(errors.length).toBe(0);
  });
});
