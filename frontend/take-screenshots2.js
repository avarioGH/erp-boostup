const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const token = 'fake_token';

  await page.goto('http://localhost:3005');
  await page.evaluate((token) => {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify({ name: 'Admin', role: 'Owner' }));
  }, token);

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const routes = [
    { name: 'logs', url: '/inventory/logs' },
    { name: 'trimming', url: '/inventory/trimming' },
    { name: 'input-logs', url: '/inventory/input-logs' },
  ];

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  for (const v of viewports) {
    await page.setViewportSize({ width: v.width, height: v.height });
    for (const r of routes) {
      await page.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
      // wait a bit for animations
      await page.waitForTimeout(1000);
      const file = path.join(outDir, `screenshot_${v.name}_${r.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Saved ${file}`);
    }
  }

  await browser.close();
  console.log('Screenshots taken!');
}

takeScreenshots();
