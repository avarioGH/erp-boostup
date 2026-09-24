const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const setupContext = async (width, height) => {
    const context = await browser.newContext({
      viewport: { width, height }
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3005/');
    await page.evaluate(() => {
      localStorage.setItem('erp_token', 'fake-token-for-visual-qa');
      localStorage.setItem('erp_user', JSON.stringify({ name: 'Admin', role: 'Owner' }));
      localStorage.setItem('active_warehouse', JSON.stringify(null));
    });
    return { context, page };
  };

  // 1. Desktop Logs
  let { page: p1, context: c1 } = await setupContext(1440, 900);
  await p1.goto('http://localhost:3005/inventory/logs', { waitUntil: 'networkidle' });
  await p1.waitForTimeout(3000); // wait longer
  console.log('Current URL Desktop Logs:', p1.url());
  await p1.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_desktop_logs.png', fullPage: true });
  await c1.close();

  // 2. Mobile Logs
  let { page: p2, context: c2 } = await setupContext(390, 844);
  await p2.goto('http://localhost:3005/inventory/logs', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(3000);
  console.log('Current URL Mobile Logs:', p2.url());
  await p2.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_mobile_logs.png', fullPage: true });
  await c2.close();
  
  // 3. Desktop Trimming
  let { page: p3, context: c3 } = await setupContext(1440, 900);
  await p3.goto('http://localhost:3005/inventory/trimming', { waitUntil: 'networkidle' });
  await p3.waitForTimeout(3000); 
  console.log('Current URL Desktop Trimming:', p3.url());
  await p3.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_desktop_trimming.png', fullPage: true });
  await c3.close();

  // 4. Mobile Trimming
  let { page: p4, context: c4 } = await setupContext(390, 844);
  await p4.goto('http://localhost:3005/inventory/trimming', { waitUntil: 'networkidle' });
  await p4.waitForTimeout(3000); 
  console.log('Current URL Mobile Trimming:', p4.url());
  await p4.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_mobile_trimming.png', fullPage: true });
  await c4.close();

  // 5. Desktop Input Logs
  let { page: p5, context: c5 } = await setupContext(1440, 900);
  await p5.goto('http://localhost:3005/inventory/input-logs', { waitUntil: 'networkidle' });
  await p5.waitForTimeout(3000); 
  console.log('Current URL Desktop Input Logs:', p5.url());
  await p5.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_desktop_input-logs.png', fullPage: true });
  await c5.close();

  // 6. Mobile Input Logs
  let { page: p6, context: c6 } = await setupContext(390, 844);
  await p6.goto('http://localhost:3005/inventory/input-logs', { waitUntil: 'networkidle' });
  await p6.waitForTimeout(3000); 
  console.log('Current URL Mobile Input Logs:', p6.url());
  await p6.screenshot({ path: 'C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/screenshot_mobile_input-logs.png', fullPage: true });
  await c6.close();

  await browser.close();
  console.log('Screenshots taken!');
})();
