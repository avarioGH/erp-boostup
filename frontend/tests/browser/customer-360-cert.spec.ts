import { test, expect, Page } from '@playwright/test';

// Define the exact report we will capture
let testStats = { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0 };
let assertStats = { total: 0, passed: 0, failed: 0 };

// Wrapper to count assertions reliably
const a = async (name: string, p: Promise<any> | any) => {
  assertStats.total++;
  try {
    if (p instanceof Promise) await p;
    else p;
    assertStats.passed++;
  } catch (e) {
    assertStats.failed++;
    throw e;
  }
};

const captureConsole = (page: Page) => {
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Browser PageError] ${error.message}`));
  page.on('requestfailed', request => console.log(`[Browser RequestFailed] ${request.url()} - ${request.failure()?.errorText}`));
};

test.describe('STEP 20H.1-C: CUSTOMER 360 CERTIFICATION', () => {

  test('Protected Route Verification', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/crm/customers');
    await a('Assert Redirects to Login', expect(page.locator('text=Masuk ke ERP Boostup')).toBeVisible({ timeout: 10000 }));
    await context.close();
  });

  test('Customer 360 End-to-End Workflow', async ({ page, isMobile }) => {
    captureConsole(page);

    // 1. Authenticate
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password123');
    await Promise.all([
      page.waitForURL('/'),
      page.click('button[type="submit"]')
    ]);
    await a('Assert Dashboard loads', expect(page.locator('text=ERP Boostup').first()).toBeVisible());

    // 2. Mobile Navigation to CRM if applicable
    if (isMobile) {
      const menuBtn = page.locator('button:has(.lucide-menu)');
      if (await menuBtn.isVisible()) {
         await menuBtn.click();
         await page.click('text=CRM');
         await page.click('text=Pelanggan');
      } else {
         await page.goto('/crm/customers');
      }
    } else {
      await page.goto('/crm/customers');
    }

    // 3. Customer List
    await a('Assert Customer List Renders', expect(page.locator('text=Customer Database')).toBeVisible({ timeout: 10000 }));
    await a('Assert E2E Mega Corp Exists', expect(page.locator('text=E2E Mega Corp')).toBeVisible());
    
    // Test filter/search
    await page.fill('input[placeholder="Search customers..."]', 'E2E Mega Corp');
    await page.waitForTimeout(500);

    // Capture Customer List Screenshot
    await page.screenshot({ path: `playwright-report/customer-list-${isMobile ? 'mobile' : 'desktop'}.png` });

    // 4. Open Customer 360
    await Promise.all([
      page.waitForURL(/\/crm\/customers\/[a-f0-9]+/),
      page.click('text=View 360')
    ]);

    // 5. Customer Header & Overview
    await a('Assert Customer Header', expect(page.locator('h1', { hasText: 'E2E Mega Corp' })).toBeVisible());
    await a('Assert Contact Info', expect(page.locator('text=mega@e2e.local')).toBeVisible());
    await a('Assert Phone Info', expect(page.locator('text=555-1234')).toBeVisible());
    
    // KPI
    await a('Assert KPI Total Invoiced', expect(page.locator('text=Rp 50.000')).toBeVisible());
    await a('Assert KPI Outstanding', expect(page.locator('text=Rp 25.000')).toBeVisible());
    await a('Assert KPI Active Opportunities', expect(page.locator('text=1').nth(1)).toBeVisible());

    // Timeline
    await a('Assert Timeline Rendered', expect(page.locator('text=Unified Timeline')).toBeVisible());
    await a('Assert Invoice Event', expect(page.locator('text=Invoice Posted')).toBeVisible());
    await a('Assert Sales Order Event', expect(page.locator('text=Sales Order Created')).toBeVisible());
    await a('Assert Quotation Event', expect(page.locator('text=Quotation QUO-E2E-001 created')).toBeVisible());

    await page.screenshot({ path: `playwright-report/c360-overview-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });

    // 6. CRM Tab
    await page.click('button[role="tab"]:has-text("CRM")');
    await a('Assert CRM Opportunities Section', expect(page.locator('h3:has-text("Opportunities"), h3:has-text("Title")').first()).toBeVisible() || expect(page.locator('text=Mega Corp Software Deal')).toBeVisible());
    await a('Assert CRM Mega Corp Software Deal', expect(page.locator('text=Mega Corp Software Deal')).toBeVisible());
    await a('Assert CRM Activity', expect(page.locator('text=Introductory Call')).toBeVisible());
    await page.screenshot({ path: `playwright-report/c360-crm-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });

    // 7. Sales Tab
    await page.click('button[role="tab"]:has-text("Sales")');
    await a('Assert Quotation Number', expect(page.locator('text=QUO-E2E-001')).toBeVisible());
    await a('Assert Sales Order Number', expect(page.locator('text=SO-E2E-001')).toBeVisible());
    await page.screenshot({ path: `playwright-report/c360-sales-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });

    // 8. Deliveries Tab
    await page.click('button[role="tab"]:has-text("Deliveries")');
    await a('Assert Delivery Number', expect(page.locator('text=DO-E2E-001')).toBeVisible());
    await page.screenshot({ path: `playwright-report/c360-deliveries-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });

    // 9. Finance Tab
    await page.click('button[role="tab"]:has-text("Finance")');
    await a('Assert Invoice Number', expect(page.locator('text=INV-E2E-001')).toBeVisible());
    await a('Assert Invoice Amount', expect(page.locator('text=Rp 50.000').first()).toBeVisible());
    await a('Assert Payment Number', expect(page.locator('text=PAY-E2E-001')).toBeVisible());
    await page.screenshot({ path: `playwright-report/c360-finance-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });

    // 10. Cross-Module Navigation & Back Navigation
    // CRM -> Opportunity
    await page.click('button[role="tab"]:has-text("CRM")');
    const oppNav = page.locator('a[href="/crm/opportunities"]');
    if (await oppNav.isVisible()) {
        await oppNav.click();
        await a('Assert Opportunity canonical route', expect(page).toHaveURL(/\/crm\/opportunities/));
        await page.goBack();
        await a('Assert back to C360', expect(page.locator('h1', { hasText: 'E2E Mega Corp' })).toBeVisible());
    }

    // Finance -> Invoices
    await page.click('button[role="tab"]:has-text("Finance")');
    const invNav = page.locator('a[href="/finance/invoices"]');
    if (await invNav.isVisible()) {
        await invNav.click();
        await a('Assert Invoices canonical route', expect(page).toHaveURL(/\/finance\/invoices/));
        await page.goBack();
        await a('Assert back to C360', expect(page.locator('h1', { hasText: 'E2E Mega Corp' })).toBeVisible());
    }

    // 11. Refresh
    await page.reload();
    await a('Assert persistence across refresh', expect(page.locator('h1', { hasText: 'E2E Mega Corp' })).toBeVisible());
  });
});
