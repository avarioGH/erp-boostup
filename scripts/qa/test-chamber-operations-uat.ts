/**
 * CHAMBER OPERATIONS UAT SCRIPT (PHASE 15D.1)
 * 
 * Execution:
 * npx ts-node scripts/qa/test-chamber-operations-uat.ts
 * 
 * Tests:
 * 1. Chamber IN (StockTransfer)
 * 2. Stock Balance checks
 * 3. Chamber OUT (StockTransfer)
 * 4. Transfer Cancellation (Reversal)
 */

async function runUAT() {
  console.log("=== STARTING CHAMBER OPERATIONS UAT ===");
  
  const token = process.env.API_TOKEN || "your_auth_token_here";
  const baseUrl = "http://localhost:3000/api";
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': \Bearer \\
  };

  async function fetchAPI(endpoint, options = {}) {
    options.headers = headers;
    const res = await fetch(\\\\, options);
    if (!res.ok) {
      const err = await res.text();
      console.warn(\\n[!] API Error at \: \ - \\);
      return null;
    }
    return res.json();
  }

  // 1. Fetch Warehouses (find Chamber and Yard)
  const warehouses = await fetchAPI('/inventory/warehouses');
  if (!warehouses || warehouses.length < 2) {
    console.error("Not enough warehouses. Please seed chambers first.");
    return;
  }
  
  const chambers = warehouses.filter(w => w.code.startsWith('CH-'));
  const yards = warehouses.filter(w => !w.code.startsWith('CH-'));
  
  if (chambers.length === 0 || yards.length === 0) {
    console.error("Missing either Chamber (CH-*) or regular Yard locations.");
    return;
  }
  
  const sourceYard = yards[0];
  const chamber = chambers[0];
  const destYard = yards.length > 1 ? yards[1] : yards[0];
  
  console.log(\\n[1] Locations Identified:\);
  console.log(\    Source Yard: \ (\)\);
  console.log(\    Chamber:     \ (\)\);
  console.log(\    Dest Yard:   \ (\)\);

  // 2. Find TimberVariant with stock in Source Yard
  const stockRes = await fetchAPI(\/inventory/timber-stock?locationId=\\);
  const availableStock = (stockRes?.items || []).filter(s => s.currentPcs >= 10);
  
  if (availableStock.length === 0) {
    console.error(\\n[!] No TimberVariant found in \ with >= 10 PCS. Seed stock first.\);
    return;
  }
  
  const targetStock = availableStock[0];
  const variantId = targetStock.timberVariantId;
  const initialQty = targetStock.currentPcs;
  
  console.log(\\n[2] Selected TimberVariant for Transfer:\);
  console.log(\    Variant ID: \\);
  console.log(\    Available in Yard: \ PCS\);
  
  // 3. Chamber IN (Create & Post Transfer)
  console.log(\\n[3] Executing CHAMBER IN (Yard -> Chamber) for 5 PCS...\);
  const inPayload = {
    fromLocationId: sourceYard.id,
    toLocationId: chamber.id,
    date: new Date().toISOString(),
    notes: "UAT Chamber IN",
    items: [
      {
        timberVariantId: variantId,
        quantityPcs: 5,
        volumeM3: (targetStock.currentVolumeM3 / targetStock.currentPcs) * 5
      }
    ]
  };
  
  const inTransfer = await fetchAPI('/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify(inPayload)
  });
  
  if (!inTransfer) return;
  console.log(\    Created Transfer: \\);
  
  const postInRes = await fetchAPI(\/inventory/transfers/\/post\, { method: 'POST' });
  if (!postInRes) return;
  console.log(\    POSTED Transfer: \\);
  
  // 4. Verify Stock after Chamber IN
  const chamberStockCheck1 = await fetchAPI(\/inventory/timber-stock?locationId=\\);
  const cStock1 = chamberStockCheck1?.items?.find(s => s.timberVariantId === variantId);
  console.log(\\n[4] Chamber Stock Verification:\);
  console.log(\    Chamber Current PCS: \ (Expected: >= 5)\);
  
  // 5. Chamber OUT (Create & Post Transfer)
  console.log(\\n[5] Executing CHAMBER OUT (Chamber -> Dest Yard) for 5 PCS...\);
  const outPayload = {
    fromLocationId: chamber.id,
    toLocationId: destYard.id,
    date: new Date().toISOString(),
    notes: "UAT Chamber OUT",
    items: [
      {
        timberVariantId: variantId,
        quantityPcs: 5,
        volumeM3: (cStock1.currentVolumeM3 / cStock1.currentPcs) * 5
      }
    ]
  };
  
  const outTransfer = await fetchAPI('/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify(outPayload)
  });
  if (!outTransfer) return;
  console.log(\    Created Transfer: \\);
  
  const postOutRes = await fetchAPI(\/inventory/transfers/\/post\, { method: 'POST' });
  if (!postOutRes) return;
  console.log(\    POSTED Transfer: \\);
  
  // 6. Verify Final Stock & Cancellation
  console.log(\\n[6] Cancelling Chamber OUT...\);
  const cancelRes = await fetchAPI(\/inventory/transfers/\/cancel\, { method: 'POST' });
  if (cancelRes) {
    console.log(\    Successfully Cancelled Transfer \\);
  }
  
  console.log(\\n=== UAT COMPLETED SAFELY ===\);
}

runUAT().catch(console.error);
