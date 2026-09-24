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

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  let { page: pD, context: cD } = await setupContext(1440, 900);
  await pD.goto(`http://localhost:3005/inventory/sawn-timber/output/mock-1`, { waitUntil: 'networkidle' });
  await pD.waitForTimeout(2000);
  await pD.screenshot({ path: `${outDir}\\screenshot_desktop_sawn-output-detail-4.1.png`, fullPage: true });
  await cD.close();
  
  let { page: pM, context: cM } = await setupContext(390, 844);
  await pM.goto(`http://localhost:3005/inventory/sawn-timber/output/mock-1`, { waitUntil: 'networkidle' });
  await pM.waitForTimeout(2000);
  await pM.screenshot({ path: `${outDir}\\screenshot_mobile_sawn-output-detail-4.1.png`, fullPage: true });
  await cM.close();

  await browser.close();
  console.log('UI-4.1 screenshots taken!');
})();
