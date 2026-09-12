/**
 * CHAMBER OPERATIONS UAT SCRIPT (PHASE 15D.3)
 * 
 * Safely isolated UAT testing.
 * Records use unique identifier `SAWMILL_UAT_<timestamp>`
 * and are cleaned up at the end.
 * 
 * Execution on VPS:
 * API_TOKEN="ey..." API_URL="https://api.erp.boostup.id" npx ts-node test-chamber-uat.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARKER = "CHAMBER_UAT_" + Date.now();
const token = process.env.API_TOKEN || "";
const baseUrl = process.env.API_URL || "https://api.erp.boostup.id";

const headers = {
  'Content-Type': 'application/json',
  'Authorization': token.startsWith('Bearer') ? token : `Bearer ${token}`
};

async function fetchAPI(endpoint: string, options: any = {}): Promise<any> {
  options.headers = headers;
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error at ${endpoint}: ${res.status} - ${err}`);
  }
  return res.json();
}

async function runUAT() {
  console.log(`=== STARTING CONNECTED CHAMBER UAT ===`);
  console.log(`API URL: ${baseUrl}`);
  console.log(`MARKER:  ${MARKER}\n`);
  
  if (!token) {
    console.error("BLOCKED: No API_TOKEN provided. Cannot authenticate against live API.");
    return;
  }

  // 1. SAFE SETUP VIA PRISMA
  console.log("[SETUP] Creating isolated mock data in database...");
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database.");

  // Create isolated Warehouses
  const yard = await prisma.warehouse.create({
    data: { company_id: company.id, code: `YARD_${MARKER}`, name: `UAT Yard ${MARKER}` }
  });
  const chamber = await prisma.warehouse.create({
    data: { company_id: company.id, code: `CH-${MARKER}`, name: `UAT Chamber ${MARKER}` }
  });

  // Create isolated Product & Variant
  const cat = await prisma.productCategory.findFirst({ where: { name: "Sawn Timber" }}) || 
              await prisma.productCategory.create({ data: { company_id: company.id, name: "Sawn Timber", code: "ST" } });
              
  const product = await prisma.product.create({
    data: { company_id: company.id, name: `Mock Product ${MARKER}`, sku: `MOCK_${MARKER}`, type: "PRODUCT", category_id: cat.id }
  });
  const variant = await prisma.timberVariant.create({
    data: { company_id: company.id, sku: `VAR_${MARKER}`, name: `Mock Variant`, species: "Jati", grade: "A", thickness: 2, width: 10, length: 200 }
  });

  // Seed Mock Stock
  const initialQty = 100;
  const initialVol = 0.5;
  await prisma.timberStock.create({
    data: {
      company_id: company.id,
      locationId: yard.id,
      timberVariantId: variant.id,
      currentPcs: initialQty,
      currentVolumeM3: initialVol,
      basePcs: initialQty,
      baseVolumeM3: initialVol
    }
  });
  
  console.log("        Isolated data setup complete.\n");

  let inTransferId = "";
  let outTransferId = "";

  try {
    // 2. CHAMBER IN UAT (API)
    console.log("[TEST 1] Testing CHAMBER IN via API (Yard -> Chamber)...");
    const inPayload = {
      fromLocationId: yard.id,
      toLocationId: chamber.id,
      date: new Date().toISOString(),
      notes: `UAT Chamber IN ${MARKER}`,
      items: [{ timberVariantId: variant.id, quantityPcs: 10, volumeM3: 0.05 }]
    };
    
    const inTransfer = await fetchAPI('/inventory/transfers', { method: 'POST', body: JSON.stringify(inPayload) });
    inTransferId = inTransfer.id;
    await fetchAPI(`/inventory/transfers/${inTransfer.id}/post`, { method: 'POST' });
    console.log("         PASS: CHAMBER IN created and posted.");

    // Verify Stock Changes
    const cStockCheck = await fetchAPI(`/inventory/timber-stock?locationId=${chamber.id}`);
    const cStock = cStockCheck.items.find((s: any) => s.timberVariantId === variant.id);
    if (!cStock || cStock.currentPcs !== 10) throw new Error("Chamber stock did not increase to 10.");
    console.log("         PASS: Chamber stock correctly increased.");

    // 3. CHAMBER OUT UAT (API)
    console.log("[TEST 2] Testing CHAMBER OUT via API (Chamber -> Yard)...");
    const outPayload = {
      fromLocationId: chamber.id,
      toLocationId: yard.id,
      date: new Date().toISOString(),
      notes: `UAT Chamber OUT ${MARKER}`,
      items: [{ timberVariantId: variant.id, quantityPcs: 5, volumeM3: 0.025 }]
    };
    
    const outTransfer = await fetchAPI('/inventory/transfers', { method: 'POST', body: JSON.stringify(outPayload) });
    outTransferId = outTransfer.id;
    await fetchAPI(`/inventory/transfers/${outTransfer.id}/post`, { method: 'POST' });
    console.log("         PASS: CHAMBER OUT created and posted.");

    const cStockCheck2 = await fetchAPI(`/inventory/timber-stock?locationId=${chamber.id}`);
    const cStock2 = cStockCheck2.items.find((s: any) => s.timberVariantId === variant.id);
    if (!cStock2 || cStock2.currentPcs !== 5) throw new Error("Chamber stock did not decrease to 5.");
    console.log("         PASS: Chamber stock correctly decreased.");

    // 4. CANCEL OUT
    console.log("[TEST 3] Testing CANCEL CHAMBER OUT...");
    await fetchAPI(`/inventory/transfers/${outTransfer.id}/cancel`, { method: 'POST' });
    console.log("         PASS: Transfer Cancelled successfully.");

    // 5. CANCEL IN
    console.log("[TEST 4] Testing CANCEL CHAMBER IN...");
    await fetchAPI(`/inventory/transfers/${inTransfer.id}/cancel`, { method: 'POST' });
    console.log("         PASS: Transfer Cancelled successfully.");

    const finalStockCheck = await fetchAPI(`/inventory/timber-stock?locationId=${chamber.id}`);
    const finalStock = finalStockCheck.items.find((s: any) => s.timberVariantId === variant.id);
    if (finalStock && finalStock.currentPcs !== 0) throw new Error("Stock did not return to 0 after cancel.");
    console.log("         PASS: Zero-sum reconciliation verified.");
    
    console.log(`\n=== PASS — PHASE 15D CONNECTED UAT COMPLETE ===\n`);

  } catch (error) {
    console.error("\n[FAIL] UAT Execution Failed:", error);
  } finally {
    console.log("[CLEANUP] Removing isolated UAT data...");
    
    try {
      if (outTransferId) {
        await prisma.stockTransferItem.deleteMany({ where: { stockTransferId: outTransferId }});
        await prisma.stockTransfer.delete({ where: { id: outTransferId }});
      }
      if (inTransferId) {
        await prisma.stockTransferItem.deleteMany({ where: { stockTransferId: inTransferId }});
        await prisma.stockTransfer.delete({ where: { id: inTransferId }});
      }

      // Find Mock Stocks
      const mockStocks = await prisma.timberStock.findMany({ where: { timberVariantId: variant.id }});
      const mockStockIds = mockStocks.map((s: any) => s.id);

      if (mockStockIds.length > 0) {
        await prisma.timberStockMovement.deleteMany({ where: { timberStockId: { in: mockStockIds } } });
        await prisma.timberStock.deleteMany({ where: { timberVariantId: variant.id }});
      }

      await prisma.timberVariant.delete({ where: { id: variant.id }});
      await prisma.product.delete({ where: { id: product.id }});
      await prisma.warehouse.delete({ where: { id: chamber.id }});
      await prisma.warehouse.delete({ where: { id: yard.id }});
      console.log("          Cleanup finished. Production data is untouched.");
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  }
}

runUAT().catch(console.error).finally(() => prisma.$disconnect());
