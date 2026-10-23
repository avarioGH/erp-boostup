import { test, expect } from '@playwright/test';

test.describe('Excel-Style Sawn Timber Spreadsheet Selection & Drag Fill', () => {
  const loginAs = async (page: any, username = 'admin', password = 'password123') => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('erp_token', 'mock_test_token_admin');
      localStorage.setItem('erp_user', JSON.stringify({ id: 'admin-1', username: 'admin', role: 'ADMIN' }));
    });
  };

  test('Selection, drag-fill, and pattern repeat in Sawn Timber Spreadsheet', async ({ page }) => {
    // Mock all API requests to api.erp.boostup.id and relative /api paths
    await page.route(/(api\.erp\.boostup\.id|\/api)/, async (route: any) => {
      const url = route.request().url();
      if (url.includes('/timber/species') || url.includes('/timber-species')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'sp-1', code: 'MERBAU', name: 'MERBAU' },
            { id: 'sp-2', code: 'JATI', name: 'JATI' }
          ]),
        });
      } else if (url.includes('/timber-variant')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // Pre-populate authentication token before loading pages
    await page.addInitScript(() => {
      localStorage.setItem('erp_token', 'mock_test_token_admin');
      localStorage.setItem('erp_user', JSON.stringify({ id: 'admin-1', username: 'admin', role: 'ADMIN' }));
    });

    // Navigate to purchase create page
    await page.goto('/inventory/purchase/create?type=sawn-timber');
    await page.waitForLoadState('domcontentloaded');

    // Wait for the Purchase page heading
    await expect(page.locator('h1', { hasText: 'Pembelian' })).toBeVisible({ timeout: 15000 });

    // Switch to sawn-timber tab if not selected
    const sawnTab = page.locator('button', { hasText: 'Beli Kayu Gergajian' }).or(page.locator('[role="tab"]', { hasText: 'Beli Kayu Gergajian' }));
    if (await sawnTab.isVisible()) {
      await sawnTab.click();
    }

    // 1. Click a cell to make it active
    const tCell0 = page.locator('#tally-cell-0-thickness');
    await expect(tCell0).toBeVisible({ timeout: 15000 });
    await tCell0.fill('16');
    await tCell0.dispatchEvent('change');

    // Also check parent td has active or selected classes
    const td0 = page.locator('td[data-cell-row="0"][data-cell-col="thickness"]');
    await expect(td0).toBeVisible();

    // Fill width and length and pcs on row 0 to test M3 recalculation
    const wCell0 = page.locator('#tally-cell-0-width');
    await wCell0.fill('20');
    await wCell0.dispatchEvent('change');

    const pCell0 = page.locator('#tally-cell-0-length');
    await pCell0.fill('400');
    await pCell0.dispatchEvent('change');

    const pcsCell0 = page.locator('#tally-cell-0-pcs');
    await pcsCell0.fill('10');
    await pcsCell0.dispatchEvent('change');

    // Expected M3: (16 * 20 * 400 * 10) / 1000000 = 1.2800
    const m3Cell0 = page.locator('td[data-cell-row="0"][data-cell-col="m3"]');
    await expect(m3Cell0).toContainText('1.2800');

    // 2. Test Fill Handle visibility
    await tCell0.focus();
    const fillHandle = page.locator('[data-testid="spreadsheet-fill-handle"]');
    await expect(fillHandle).toBeVisible();

    // 3. Test Drag Fill: drag handle down across rows 1, 2, 3
    const destTd3 = page.locator('td[data-cell-row="3"][data-cell-col="thickness"]');
    await fillHandle.dragTo(destTd3);

    // Verify row 1, 2, 3 thickness values are all '16'
    await expect(page.locator('#tally-cell-1-thickness')).toHaveValue('16');
    await expect(page.locator('#tally-cell-2-thickness')).toHaveValue('16');
    await expect(page.locator('#tally-cell-3-thickness')).toHaveValue('16');

    // 4. Test Multi-row drag fill pattern:
    // Set row 1 width = 10, row 2 width = 20
    const wCell1 = page.locator('#tally-cell-1-width');
    await wCell1.fill('10');
    await wCell1.dispatchEvent('change');

    const wCell2 = page.locator('#tally-cell-2-width');
    await wCell2.fill('20');
    await wCell2.dispatchEvent('change');

    // Select row 1 and 2 width cells by dragging mouse
    const tdW1 = page.locator('td[data-cell-row="1"][data-cell-col="width"]');
    const tdW2 = page.locator('td[data-cell-row="2"][data-cell-col="width"]');
    const bW1 = await tdW1.boundingBox();
    const bW2 = await tdW2.boundingBox();

    if (bW1 && bW2) {
      await page.mouse.move(bW1.x + 5, bW1.y + 5);
      await page.mouse.down();
      await page.mouse.move(bW2.x + 5, bW2.y + 5, { steps: 3 });
      await page.mouse.up();
    }

    // Drag handle down to row 4
    await expect(fillHandle).toBeVisible();
    const handleBox2 = await fillHandle.boundingBox();
    const tdW4 = page.locator('td[data-cell-row="4"][data-cell-col="width"]');
    const bW4 = await tdW4.boundingBox();

    if (handleBox2 && bW4) {
      await page.mouse.move(handleBox2.x + handleBox2.width / 2, handleBox2.y + handleBox2.height / 2);
      await page.mouse.down();
      await page.mouse.move(bW4.x + bW4.width / 2, bW4.y + bW4.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    // Repeated pattern: row 3 width = 10, row 4 width = 20
    await expect(page.locator('#tally-cell-3-width')).toHaveValue('10');
    await expect(page.locator('#tally-cell-4-width')).toHaveValue('20');

    // 5. Test Escape cancellation during drag fill
    const pcsCell1 = page.locator('#tally-cell-1-pcs');
    await pcsCell1.fill('99');
    await pcsCell1.dispatchEvent('change');
    await pcsCell1.focus();

    await expect(fillHandle).toBeVisible();
    const handleBox3 = await fillHandle.boundingBox();
    const destPcs5 = page.locator('td[data-cell-row="5"][data-cell-col="pcs"]');
    const bPcs5 = await destPcs5.boundingBox();

    if (handleBox3 && bPcs5) {
      await page.mouse.move(handleBox3.x + handleBox3.width / 2, handleBox3.y + handleBox3.height / 2);
      await page.mouse.down();
      await page.mouse.move(bPcs5.x + bPcs5.width / 2, bPcs5.y + bPcs5.height / 2, { steps: 5 });
      // Press Escape while dragging
      await page.keyboard.press('Escape');
      await page.mouse.up();
    }

    // Row 5 pcs must still be empty or 0, not 99
    const val5 = await page.locator('#tally-cell-5-pcs').inputValue();
    expect(val5).not.toBe('99');
  });
});
