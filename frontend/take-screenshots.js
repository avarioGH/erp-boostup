const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const setupContext = async (width, height) => {
    const context = await browser.newContext({
      viewport: { width, height }
    });
    const page = await context.newPage();
    // Inject auth to bypass login
    await page.goto('http://localhost:3005/');
    await page.evaluate(() => {
      localStorage.setItem('erp_token', 'fake-token-for-visual-qa');
      localStorage.setItem('erp_user', JSON.stringify({ name: 'Admin', role: 'Owner' }));
      localStorage.setItem('active_warehouse', JSON.stringify(null));
    });
    return { context, page };
  };

  // 1. Desktop Purchase
  let { page: p1, context: c1 } = await setupContext(1440, 900);
  await p1.goto('http://localhost:3005/inventory/purchase');
  await p1.waitForTimeout(2000); // wait for load
  await p1.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_desktop_purchase.png', fullPage: true });
  await c1.close();

  // 2. Mobile Purchase
  let { page: p2, context: c2 } = await setupContext(390, 844);
  await p2.goto('http://localhost:3005/inventory/purchase');
  await p2.waitForTimeout(2000); // wait for load
  await p2.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_mobile_purchase.png', fullPage: true });
  await c2.close();
  
  // 3. Desktop Dashboard
  let { page: p3, context: c3 } = await setupContext(1440, 900);
  await p3.goto('http://localhost:3005/inventory/dashboard');
  await p3.waitForTimeout(2000); // wait for load
  await p3.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_desktop_dashboard.png', fullPage: true });
  await c3.close();

  // 4. Mobile Dashboard
  let { page: p4, context: c4 } = await setupContext(390, 844);
  await p4.goto('http://localhost:3005/inventory/dashboard');
  await p4.waitForTimeout(2000); // wait for load
  await p4.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_mobile_dashboard.png', fullPage: true });
  await c4.close();

  await browser.close();
  console.log('Screenshots taken!');
})();
