const fs = require('fs');
let s = fs.readFileSync('backend/src/inventory/inventory.controller.ts', 'utf8');

const migrationCode = `
  @Get('migrate-history')
  async migrateHistory(@Request() req) {
    const companyId = req.user.company_id || req.user.companyId;
    if (!companyId) return { success: false, message: 'No company ID' };
    
    // Find Gudang A
    const warehouses = await this.inventoryService['prisma'].warehouse.findMany({
      where: { company_id: companyId }
    });
    
    const gudangA = warehouses.find(w => w.name.toLowerCase().includes('gudang a') || w.name.toLowerCase() === 'a');
    if (!gudangA) return { success: false, message: 'Gudang A not found', warehouses };
    
    const whId = gudangA.id;
    
    // Update Sales Orders
    const soRes = await this.inventoryService['prisma'].salesOrder.updateMany({
      where: { company_id: companyId, warehouse_id: null },
      data: { warehouse_id: whId }
    });
    
    // Update Invoices
    const invRes = await this.inventoryService['prisma'].invoice.updateMany({
      where: { company_id: companyId, warehouse_id: null },
      data: { warehouse_id: whId }
    });

    // Update Movements? (Only if they don't have one)
    // Actually, movements already have warehouse_id from POS if it was provided, 
    // but if it wasn't, let's just update all movements where warehouse_id is null? Wait, movements require warehouse_id.
    
    return {
      success: true,
      message: 'Migrated successfully',
      targetWarehouse: gudangA.name,
      salesOrdersUpdated: soRes.count,
      invoicesUpdated: invRes?.count || 0
    };
  }
`;

s = s.replace(/export class InventoryController \{/, `export class InventoryController {${migrationCode}`);
fs.writeFileSync('backend/src/inventory/inventory.controller.ts', s);
console.log('Added migrate route');
