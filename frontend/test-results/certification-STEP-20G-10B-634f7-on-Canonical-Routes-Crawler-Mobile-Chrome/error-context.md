# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: certification.spec.ts >> STEP 20G.10B Certification >> Canonical Routes Crawler
- Location: tests\browser\certification.spec.ts:47:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Dashboard').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Dashboard').first() with timeout 10000ms
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('STEP 20G.10B Certification', () => {
  4  |   test('Authentication & Error States', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await expect(page.locator('text=Sign In').first()).toBeVisible();
  7  | 
  8  |     await page.fill('#username', 'invalid');
  9  |     await page.fill('#password', 'wrong');
  10 |     await page.click('button[type="submit"]');
  11 |     
  12 |     // Look for error message
  13 |     const errorText = page.locator('text=Login failed').first();
  14 |     await errorText.waitFor({ timeout: 5000 }).catch(() => null); 
  15 | 
  16 |     await page.fill('#username', 'admin');
  17 |     await page.fill('#password', 'password123');
  18 |     await page.click('button[type="submit"]');
  19 | 
  20 |     // Wait for the redirect to finish
  21 |     await page.waitForURL('**/', { timeout: 10000 }).catch(() => null);
  22 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  23 |   });
  24 | 
  25 |   test('Legacy Routes Redirects', async ({ page }) => {
  26 |     await page.goto('/login');
  27 |     await page.fill('#username', 'admin');
  28 |     await page.fill('#password', 'password123');
  29 |     await page.click('button[type="submit"]');
  30 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
  31 | 
  32 |     const legacyRoutes = [
  33 |       { from: '/reports/finance', to: '/finance/reports' },
  34 |       { from: '/customers/list', to: '/crm/customers' },
  35 |       { from: '/customers', to: '/crm/customers' },
  36 |       { from: '/inventory/stock-transfer', to: '/inventory/transfers' }
  37 |     ];
  38 | 
  39 |     for (const route of legacyRoutes) {
  40 |       await page.goto(route.from);
  41 |       await page.waitForTimeout(1000); 
  42 |       // check if URL contains the target
  43 |       expect(page.url()).toContain(route.to);
  44 |     }
  45 |   });
  46 | 
  47 |   test('Canonical Routes Crawler', async ({ page }) => {
  48 |     await page.goto('/login');
  49 |     await page.fill('#username', 'admin');
  50 |     await page.fill('#password', 'password123');
  51 |     await page.click('button[type="submit"]');
> 52 |     await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  53 | 
  54 |     const errors = [];
  55 |     const targetRoutes = [
  56 |       '/crm/customers', '/sales/orders', '/purchasing/orders', 
  57 |       '/inventory/stock', '/manufacturing/mrp', '/finance/invoices',
  58 |       '/finance/gl', '/hr/employees', '/hr/payroll', '/finance/assets',
  59 |       '/approvals', '/reports/sales'
  60 |     ];
  61 | 
  62 |     for (const route of targetRoutes) {
  63 |       const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  64 |       // If we got redirected back to login, the route is broken or unprotected
  65 |       if (page.url().includes('/login')) {
  66 |          errors.push(`${route} - Redirected to login`);
  67 |       } else if (response && response.status() >= 400) {
  68 |          errors.push(`${route} - Status ${response.status()}`);
  69 |       }
  70 |     }
  71 |     
  72 |     expect(errors).toEqual([]);
  73 |   });
  74 | });
  75 | 
```