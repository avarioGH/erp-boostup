const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const setupContext = async (width, height) => {
    const context = await browser.newContext({
      viewport: { width, height }
    });
    const page = await context.newPage();

    // Intercept production list API to mock data so we can see the table
    await page.route('**/api/production', async route => {
      const json = {
        items: [
          {
            id: 'mock-1',
            processNumber: 'PRD-2023-0001',
            processType: 'GESEK',
            date: new Date().toISOString(),
            status: 'CONFIRMED',
            inputs: [{ id: 1 }, { id: 2 }],
            outputs: [{ id: 1 }],
            totalInputM3: 42.10,
            totalOutputM3: 28.50
          },
          {
            id: 'mock-2',
            processNumber: 'PRD-2023-0002',
            processType: 'PLAT',
            date: new Date().toISOString(),
            status: 'DRAFT',
            inputs: [{ id: 1 }],
            outputs: [],
            totalInputM3: 10.00,
            totalOutputM3: 0
          }
        ]
      };
      await route.fulfill({ json });
    });

    // Intercept detail page API
    await page.route('**/api/production/mock-1', async route => {
      const json = {
        id: 'mock-1',
        processNumber: 'PRD-2023-0001',
        processType: 'GESEK',
        date: new Date().toISOString(),
        status: 'CONFIRMED',
        notes: 'Mock production for testing.',
        operator: 'John Doe',
        inputs: [
          { id: 'in1', timberStock: { bundleNumber: 'BND-001' }, quantity: 15 },
          { id: 'in2', timberStock: { bundleNumber: 'BND-002' }, quantity: 27 }
        ],
        outputs: [
          { id: 'out1', variant: { name: 'Meranti 4x6' }, type: 'PRODUCT', quantity: 28, remarks: 'Grade A' },
          { id: 'out2', variant: { name: 'Serbuk Gergaji' }, type: 'WASTE', quantity: 5, remarks: 'Disposed' }
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
    { name: 'production-list', url: '/inventory/production' },
    { name: 'production-create', url: '/inventory/production/create' },
    { name: 'production-detail', url: '/inventory/production/mock-1' }
  ];

  const outDir = 'C:\\Users\\Billion\\.gemini\\antigravity\\brain\\44e00d99-ee86-4b30-ac77-173455a2620c';

  for (const r of routes) {
    // Desktop
    let { page: pD, context: cD } = await setupContext(1440, 900);
    await pD.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await pD.waitForTimeout(3000);
    await pD.screenshot({ path: `${outDir}\\screenshot_desktop_${r.name}.png`, fullPage: true });
    await cD.close();
    
    // Mobile
    let { page: pM, context: cM } = await setupContext(390, 844);
    await pM.goto(`http://localhost:3005${r.url}`, { waitUntil: 'networkidle' });
    await pM.waitForTimeout(3000);
    await pM.screenshot({ path: `${outDir}\\screenshot_mobile_${r.name}.png`, fullPage: true });
    await cM.close();
  }

  await browser.close();
  console.log('UI-3 screenshots taken!');
})();
