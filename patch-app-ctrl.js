const fs = require('fs');
let s = fs.readFileSync('backend/src/app.controller.ts', 'utf8');

const migrationCode = `
  @Get('migrate-now')
  async migrateNow() {
    // Hardcoded bypass to migrate Gudang A
    const warehouses = await this.prisma.warehouse.findMany({});
    const gudangA = warehouses.find(w => w.name.toLowerCase().includes('gudang a') || w.name.toLowerCase() === 'a');
    if (!gudangA) return { error: 'Gudang A not found' };
    
    const whId = gudangA.id;
    const companyId = gudangA.company_id;
    
    const soRes = await this.prisma.salesOrder.updateMany({
      where: { company_id: companyId, warehouse_id: null },
      data: { warehouse_id: whId }
    });
    
    const soRes2 = await this.prisma.salesOrder.updateMany({
      where: { company_id: companyId, warehouse_id: { isSet: false } },
      data: { warehouse_id: whId }
    });

    const posRes = await this.prisma.posShift.updateMany({
      where: { company_id: companyId, warehouse_id: null },
      data: { warehouse_id: whId }
    });
    
    return { 
      migrated: true, 
      salesOrdersUpdated: soRes.count + soRes2.count,
      posShiftsUpdated: posRes.count,
      warehouseId: whId
    };
  }
`;

if (!s.includes('migrate-now')) {
  s = s.replace(/export class AppController \{/, `export class AppController {${migrationCode}`);
  fs.writeFileSync('backend/src/app.controller.ts', s);
}
console.log('Added migrate-now to AppController');
