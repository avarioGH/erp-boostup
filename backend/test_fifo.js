const { PrismaClient } = require('@prisma/client');
const { createFifoLayer, consumeFifoLayers } = require('./dist/src/inventory/fifo.engine');
const prisma = new PrismaClient();

async function run() {
  await prisma.$connect();
  const companyId = '654321098765432109876543';
  const warehouseId = '654321098765432109876544';
  const productId = '654321098765432109876545';
  
  // Cleanup
  await prisma.costLayerConsumption.deleteMany({ where: { company_id: companyId } });
  await prisma.inventoryCostLayer.deleteMany({ where: { company_id: companyId } });
  await prisma.stockMovement.deleteMany({ where: { company_id: companyId } });
  
  await prisma.$transaction(async (tx) => {
    console.log('1. Inbound 10 @ $10');
    const mov1 = await tx.stockMovement.create({
      data: { company_id: companyId, warehouse_id: warehouseId, product_id: productId, transaction_type: 'IN', transaction_id: 'TX1', movement_type: 'IN', qty_in: 10, qty_out: 0, balance_after: 10, unit_cost: 10, total_cost: 100, created_by: 'SYS' }
    });
    await createFifoLayer(tx, { companyId, productId, warehouseId, quantity: 10, unitCost: 10, stockMovementId: mov1.id });
    
    // Slight delay to ensure chronological sorting by created_at (since MongoDB ObjectId is also chronological, we are fine, but sleep is safer)
    await new Promise(r => setTimeout(r, 100));

    console.log('2. Inbound 10 @ $15');
    const mov2 = await tx.stockMovement.create({
      data: { company_id: companyId, warehouse_id: warehouseId, product_id: productId, transaction_type: 'IN', transaction_id: 'TX2', movement_type: 'IN', qty_in: 10, qty_out: 0, balance_after: 20, unit_cost: 15, total_cost: 150, created_by: 'SYS' }
    });
    await createFifoLayer(tx, { companyId, productId, warehouseId, quantity: 10, unitCost: 15, stockMovementId: mov2.id });
    
    console.log('3. Outbound 15');
    const mov3 = await tx.stockMovement.create({
      data: { company_id: companyId, warehouse_id: warehouseId, product_id: productId, transaction_type: 'OUT', transaction_id: 'TX3', movement_type: 'OUT', qty_in: 0, qty_out: 15, balance_after: 5, unit_cost: 0, total_cost: 0, created_by: 'SYS' }
    });
    const { totalCogs, consumed } = await consumeFifoLayers(tx, { companyId, productId, warehouseId, quantity: 15, stockMovementId: mov3.id });
    
    console.log('Consumed details:', consumed);
    console.log('Total COGS:', totalCogs);
    
    if (totalCogs !== 175) {
      throw new Error(`Expected COGS to be 175, but got ${totalCogs}`);
    } else {
      console.log('SUCCESS: COGS is exactly $175');
    }
  });

  const remainingLayers = await prisma.inventoryCostLayer.findMany({ where: { company_id: companyId, remaining_quantity: { gt: 0 } } });
  console.log('Remaining layers:', remainingLayers.map(l => ({ qty: l.remaining_quantity, cost: l.unit_cost })));
  
  if (remainingLayers.length === 1 && remainingLayers[0].remaining_quantity === 5 && remainingLayers[0].unit_cost === 15) {
    console.log('SUCCESS: 5 units @ $15 remaining');
  } else {
    throw new Error('Layer mismatch');
  }

  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
