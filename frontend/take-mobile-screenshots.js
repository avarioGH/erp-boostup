const { chromium } = require('playwright');

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

  const routes = [
    { name: 'logs', url: '/inventory/logs' },
    { name: 'trimming', url: '/inventory/trimming' },
    { name: 'input-logs', url: '/inventory/input-logs' },
  ];

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  for (const r of routes) {
    let { page, context } = await setupContext(390, 844);
    await page.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const file = `${outDir}\\screenshot_mobile_${r.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved ${file}`);
    await context.close();
  }

  await browser.close();
  console.log('Mobile screenshots taken!');
})();
