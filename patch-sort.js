const fs = require('fs');
let file = 'backend/src/sales/export-shipment.service.ts';
let content = fs.readFileSync(file, 'utf8');

const oldFindAll = `  async findAll(companyId: string) {
    return this.prisma.exportShipment.findMany({
      where: { company_id: companyId },
      include: { items: true },
      orderBy: { exportDate: 'desc' },
    });
  }`;

const newFindAll = `  async findAll(companyId: string) {
    return this.prisma.exportShipment.findMany({
      where: { company_id: companyId },
      include: { items: true },
      orderBy: [
        { exportDate: 'desc' },
        { created_at: 'desc' }
      ],
    });
  }`;

content = content.replace(oldFindAll, newFindAll);
fs.writeFileSync(file, content);
console.log('Patched export-shipment.service.ts');
