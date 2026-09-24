const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const setupContext = async (width, height) => {
    const context = await browser.newContext({
      viewport: { width, height }
    });
    const page = await context.newPage();

    // List mock
    await page.route('**/api/sawn-timber/outputs', async route => {
      const json = {
        items: [
          {
            id: 'mock-1',
            bundleNumber: 'BND-2023-991',
            outputDate: new Date().toISOString(),
            status: 'POSTED',
            inputLog: { inputNumber: 'LOG-IN-001' },
            items: [
              {
                timberVariant: { sku: 'MERANTI-A-4x6' },
                quantityPcs: 150,
                volumeM3: 3.60
              }
            ]
          },
          {
            id: 'mock-2',
            bundleNumber: 'BND-2023-992',
            outputDate: new Date().toISOString(),
            status: 'DRAFT',
            inputLog: null,
            items: [
              {
                timberVariant: { sku: 'MERANTI-B-2x4' },
                quantityPcs: 300,
                volumeM3: 2.40
              }
            ]
          }
        ]
      };
      await route.fulfill({ json });
    });

    // Detail mock
    await page.route('**/api/sawn-timber/outputs/mock-1', async route => {
      const json = {
        id: 'mock-1',
        bundleNumber: 'BND-2023-991',
        outputDate: new Date().toISOString(),
        shift: '1',
        batch: 'PRT-A1',
        location: { name: 'Main Warehouse' },
        status: 'POSTED',
        inputLogId: 'log-id-1',
        inputLog: { inputNumber: 'LOG-IN-001' },
        items: [
          {
            id: 'item-1',
            timberVariant: { sku: 'MERANTI-A-4x6', species: 'Meranti' },
            grade: 'A',
            thicknessMm: 40,
            widthMm: 60,
            lengthMm: 4000,
            quantityPcs: 150,
            volumeM3: 3.60
          }
        ]
      };
      await route.fulfill({ json });
    });

    await page.goto('http://localhost:3005/');
    await page.evaluate(() => {
      localStorage.setItem('erp_token', 'fake-token-for-visual-qa');
      localStorage.setItem('erp_user', JSON.stringify({ name: 'Admin', role: 'Owner' }));
      localStorage.setItem('active_warehouse', JSON.stringify(null));
    });
    return { context, page };
  };

  const routes = [
    { name: 'sawn-output-list', url: '/inventory/sawn-timber/output' },
    { name: 'sawn-output-create', url: '/inventory/sawn-timber/output/create' },
    { name: 'sawn-output-detail', url: '/inventory/sawn-timber/output/mock-1' }
  ];

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  for (const r of routes) {
    let { page: pD, context: cD } = await setupContext(1440, 900);
    await pD.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await pD.waitForTimeout(3000);
    await pD.screenshot({ path: `${outDir}\\screenshot_desktop_${r.name}.png`, fullPage: true });
    await cD.close();
    
    let { page: pM, context: cM } = await setupContext(390, 844);
    await pM.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await pM.waitForTimeout(3000);
    await pM.screenshot({ path: `${outDir}\\screenshot_mobile_${r.name}.png`, fullPage: true });
    await cM.close();
  }

  await browser.close();
  console.log('UI-4 screenshots taken!');
})();
