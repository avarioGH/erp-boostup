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
    { name: 'print-trimming', url: '/inventory/trimming/err-mock/print' },
    { name: 'print-input-log', url: '/inventory/input-logs/err-mock/print' },
    { name: 'print-production', url: '/inventory/production/err-mock/print' },
    { name: 'print-shipment', url: '/inventory/shipment/err-mock/print' },
    { name: 'print-transfer', url: '/inventory/transfers/err-mock/print' }
  ];

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  for (const r of routes) {
    let { page: pD, context: cD } = await setupContext(1440, 900);
    // Ignore the print dialogs if they pop up
    pD.on('dialog', dialog => dialog.accept());
    
    await pD.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await pD.waitForTimeout(2000);
    await pD.screenshot({ path: `${outDir}\\screenshot_desktop_${r.name}.png`, fullPage: true });
    await cD.close();
  }

  await browser.close();
  console.log('UI-8 screenshots taken!');
})();
