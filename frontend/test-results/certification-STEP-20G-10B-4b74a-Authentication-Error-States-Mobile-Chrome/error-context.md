# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: certification.spec.ts >> STEP 20G.10B Certification >> Authentication & Error States
- Location: tests\browser\certification.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Login').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Login').first() with timeout 5000ms
  - waiting for locator('text=Login').first()

```

```yaml
- alert
- main:
  - heading "Welcome back" [level=1]
  - paragraph: Enter your credentials to sign in to your workspace
  - text: Sign In Use your owner or admin account. Username
  - textbox "Username":
    - /placeholder: e.g. owner
  - text: Password
  - link "Forgot password?":
    - /url: "#"
  - textbox "Password"
  - button "Sign In"
  - paragraph:
    - text: By clicking continue, you agree to our
    - link "Terms of Service":
      - /url: "#"
    - text: and
    - link "Privacy Policy":
      - /url: "#"
    - text: .
  - button
```

# Test source

```ts
  1  | ﻿import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('STEP 20G.10B Certification', () => {
  4  | 
  5  |   test('Authentication & Error States', async ({ page }) => {
  6  |     await page.goto('/login');
> 7  |     await expect(page.locator('text=Login').first()).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  8  | 
  9  |     await page.fill('#username', 'invalid');
  10 |     await page.fill('#password', 'wrong');
  11 |     await page.click('button[type="submit"]');
  12 |     
  13 |     // Look for error message
  14 |     const errorText = page.locator('text=Login failed').first();
  15 |     // Wait for either the error to appear, or for a timeout
  16 |     await errorText.waitFor({ timeout: 5000 }).catch(() => null); 
  17 | 
  18 |     await page.fill('#username', 'admin');
  19 |     await page.fill('#password', 'password123');
  20 |     await Promise.all([
  21 |       page.waitForResponse(resp => resp.url().includes('login') && resp.status() === 201).catch(() => null),
  22 |       page.click('button[type="submit"]')
  23 |     ]);
  24 | 
  25 |     await page.waitForTimeout(2000); // Give time for redirect
  26 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  27 | 
  28 |     await page.reload();
  29 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  30 |   });
  31 | 
  32 |   test('Legacy Routes Redirects', async ({ page }) => {
  33 |     await page.goto('/login');
  34 |     await page.fill('#username', 'admin');
  35 |     await page.fill('#password', 'password123');
  36 |     await page.click('button[type="submit"]');
  37 |     await page.waitForTimeout(2000);
  38 | 
  39 |     const legacyRoutes = [
  40 |       { from: '/reports/finance', to: '/finance/reports' },
  41 |       { from: '/customers/list', to: '/crm/customers' },
  42 |       { from: '/customers', to: '/crm/customers' },
  43 |       { from: '/inventory/stock-transfer', to: '/inventory/transfers' }
  44 |     ];
  45 | 
  46 |     for (const route of legacyRoutes) {
  47 |       await page.goto(route.from);
  48 |       await page.waitForTimeout(1000); // wait for redirect
  49 |       await expect(page).toHaveURL(new RegExp(route.to));
  50 |     }
  51 |   });
  52 | 
  53 |   test('Canonical Routes Crawler', async ({ page }) => {
  54 |     await page.goto('/login');
  55 |     await page.fill('#username', 'admin');
  56 |     await page.fill('#password', 'password123');
  57 |     await page.click('button[type="submit"]');
  58 |     await page.waitForTimeout(2000);
  59 | 
  60 |     const errors = [];
  61 |     const targetRoutes = [
  62 |       '/', '/crm/customers', '/sales/orders', '/purchasing/orders', 
  63 |       '/inventory/stock', '/manufacturing/mrp', '/finance/invoices',
  64 |       '/finance/gl', '/hr/employees', '/hr/payroll', '/finance/assets',
  65 |       '/approvals', '/reports/sales'
  66 |     ];
  67 | 
  68 |     for (const route of targetRoutes) {
  69 |       const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  70 |       if (!response) {
  71 |         errors.push(`${route} - No response`);
  72 |         continue;
  73 |       }
  74 |       if (response.status() >= 400) {
  75 |         errors.push(`${route} - Status ${response.status()}`);
  76 |       }
  77 |     }
  78 |     
  79 |     expect(errors.length).toBe(0);
  80 |   });
  81 | });
  82 | 
```