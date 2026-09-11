
/**
 * CHAMBER OPERATIONS UAT SCRIPT (PHASE 15D.1)
 * 
 * Execution:
 * npx ts-node scripts/qa/test-chamber-operations-uat.ts
 */

async function runUAT() {
  console.log("=== STARTING CHAMBER OPERATIONS UAT ===");
  
  const token = process.env.API_TOKEN || "your_auth_token_here";
  const baseUrl = "http://localhost:3000/api";
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  async function fetchAPI(endpoint: string, options: any = {}): Promise<any> {
    options.headers = headers;
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    if (!res.ok) {
      const err = await res.text();
      console.warn(`\n[!] API Error at ${endpoint}: ${res.status} - ${err}`);
      return null;
    }
    return res.json();
  }

  const warehouses: any[] = await fetchAPI('/inventory/warehouses');
  if (!warehouses || warehouses.length < 2) {
    console.error("Not enough warehouses. Please seed chambers first.");
    return;
  }
  
  const chambers = warehouses.filter((w: any) => w.code.startsWith('CH-'));
  const yards = warehouses.filter((w: any) => !w.code.startsWith('CH-'));
  
  if (chambers.length === 0 || yards.length === 0) {
    console.error("Missing either Chamber (CH-*) or regular Yard locations.");
    return;
  }
  
  const sourceYard = yards[0];
  const chamber = chambers[0];
  const destYard = yards.length > 1 ? yards[1] : yards[0];
  
  console.log(`\n[1] Locations Identified:`);
  console.log(`    Source Yard: ${sourceYard.name} (${sourceYard.id})`);
  console.log(`    Chamber:     ${chamber.name} (${chamber.id})`);
  console.log(`    Dest Yard:   ${destYard.name} (${destYard.id})`);

  const stockRes: any = await fetchAPI(`/inventory/timber-stock?locationId=${sourceYard.id}`);
  const availableStock = (stockRes?.items || []).filter((s: any) => s.currentPcs >= 10);
  
  if (availableStock.length === 0) {
    console.error(`\n[!] No TimberVariant found in ${sourceYard.name} with >= 10 PCS. Seed stock first.`);
    return;
  }
  
  const targetStock = availableStock[0];
  const variantId = targetStock.timberVariantId;
  const initialQty = targetStock.currentPcs;
  
  console.log(`\n[2] Selected TimberVariant for Transfer:`);
  console.log(`    Variant ID: ${variantId}`);
  console.log(`    Available in Yard: ${initialQty} PCS`);
  
  console.log(`\n[3] Executing CHAMBER IN (Yard -> Chamber) for 5 PCS...`);
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
  
  const inTransfer: any = await fetchAPI('/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify(inPayload)
  });
  
  if (!inTransfer) return;
  console.log(`    Created Transfer: ${inTransfer.transferNumber}`);
  
  const postInRes = await fetchAPI(`/inventory/transfers/${inTransfer.id}/post`, { method: 'POST' });
  if (!postInRes) return;
  console.log(`    POSTED Transfer: ${inTransfer.transferNumber}`);
  
  const chamberStockCheck1: any = await fetchAPI(`/inventory/timber-stock?locationId=${chamber.id}`);
  const cStock1 = chamberStockCheck1?.items?.find((s: any) => s.timberVariantId === variantId);
  console.log(`\n[4] Chamber Stock Verification:`);
  console.log(`    Chamber Current PCS: ${cStock1 ? cStock1.currentPcs : 0} (Expected: >= 5)`);
  
  console.log(`\n[5] Executing CHAMBER OUT (Chamber -> Dest Yard) for 5 PCS...`);
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
  
  const outTransfer: any = await fetchAPI('/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify(outPayload)
  });
  if (!outTransfer) return;
  console.log(`    Created Transfer: ${outTransfer.transferNumber}`);
  
  const postOutRes = await fetchAPI(`/inventory/transfers/${outTransfer.id}/post`, { method: 'POST' });
  if (!postOutRes) return;
  console.log(`    POSTED Transfer: ${outTransfer.transferNumber}`);
  
  console.log(`\n[6] Cancelling Chamber OUT...`);
  const cancelRes = await fetchAPI(`/inventory/transfers/${outTransfer.id}/cancel`, { method: 'POST' });
  if (cancelRes) {
    console.log(`    Successfully Cancelled Transfer ${outTransfer.transferNumber}`);
  }
  
  console.log(`\n=== UAT COMPLETED SAFELY ===`);
}

runUAT().catch(console.error);
