# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> STEP 20G.10A Smoke Test >> Viewport - Mobile
- Location: tests\browser\smoke.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Dashboard').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Dashboard').first() with timeout 15000ms
  - waiting for locator('text=Dashboard').first()

```

```yaml
- alert
- main:
  - heading "Welcome back" [level=1]
  - paragraph: Enter your credentials to sign in to your workspace
  - text: Sign In Use your owner or admin account. Network Error Username
  - textbox "Username":
    - /placeholder: e.g. owner
    - text: admin
  - text: Password
  - link "Forgot password?":
    - /url: "#"
  - textbox "Password": password123
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
  3  | test.describe('STEP 20G.10A Smoke Test', () => {
  4  |   test('Dashboard and Smoke flows', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.fill('#username', 'admin');
  7  |     await page.fill('#password', 'password123');
  8  |     await page.click('button[type="submit"]');
  9  | 
  10 |     // Wait for element instead of URL
  11 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 15000 });
  12 |     await page.screenshot({ path: 'tests/browser/dashboard-screenshot.png' });
  13 | 
  14 |     await page.goto('/inventory/products');
  15 |     await expect(page.locator('text=Product').first()).toBeVisible({ timeout: 10000 });
  16 |     await page.reload();
  17 |     await expect(page.locator('text=Product').first()).toBeVisible({ timeout: 10000 });
  18 | 
  19 |     const logoutBtn = page.locator('text=Logout');
  20 |     if (await logoutBtn.count() > 0) {
  21 |       await logoutBtn.first().click();
  22 |     }
  23 |   });
  24 | 
  25 |   test('Viewport - Mobile', async ({ page }) => {
  26 |     await page.setViewportSize({ width: 390, height: 844 });
  27 |     await page.goto('/login');
  28 |     await page.fill('#username', 'admin');
  29 |     await page.fill('#password', 'password123');
  30 |     await page.click('button[type="submit"]');
> 31 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 15000 });
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  32 |     await page.screenshot({ path: 'tests/browser/mobile-screenshot.png' });
  33 |   });
  34 | 
  35 |   test('Viewport - Tablet', async ({ page }) => {
  36 |     await page.setViewportSize({ width: 768, height: 1024 });
  37 |     await page.goto('/login');
  38 |     await page.fill('#username', 'admin');
  39 |     await page.fill('#password', 'password123');
  40 |     await page.click('button[type="submit"]');
  41 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 15000 });
  42 |     await page.screenshot({ path: 'tests/browser/tablet-screenshot.png' });
  43 |   });
  44 | });
  45 | 
```