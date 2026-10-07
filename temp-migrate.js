const fs = require('fs');
let s = fs.readFileSync('backend/src/inventory/inventory.controller.ts', 'utf8');

const migrationCode = `
  @Get('migrate-all')
  async migrateAll() {
    try {
      const warehouses = await this.inventoryService['prisma'].warehouse.findMany({});
      const gudangA = warehouses.find(w => w.name.toLowerCase().includes('a'));
      if (!gudangA) return { error: 'Gudang A not found' };
      
      const whId = gudangA.id;
      
      const soRes = await this.inventoryService['prisma'].salesOrder.updateMany({
        where: { warehouse_id: { isSet: false } },
        data: { warehouse_id: whId }
      });

      return { 
        success: true, 
        whId,
        soUpdated: soRes.count
      };
    } catch(e) {
      return { error: e.message };
    }
  }
`;

s = s.replace(/export class InventoryController \{/, `export class InventoryController {${migrationCode}`);
fs.writeFileSync('backend/src/inventory/inventory.controller.ts', s);
console.log('Added migrate-all');
