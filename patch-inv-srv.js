const fs = require('fs');
let s = fs.readFileSync('backend/src/inventory/inventory.service.ts', 'utf8');

s = s.replace(
  /async getWarehouseStocks\(companyId: string\) \{\n\s*return this\.prisma\.warehouseStock\.findMany\(\{\n\s*where: \{ company_id: companyId \},\n\s*include: \{ warehouse: true, product: true \},\n\s*\}\);\n\s*\}/,
  `async getWarehouseStocks(companyId: string, warehouseId?: string) {
    const where: any = { company_id: companyId };
    if (warehouseId) where.warehouse_id = warehouseId;
    return this.prisma.warehouseStock.findMany({
      where,
      include: { warehouse: true, product: true },
    });
  }`
);

fs.writeFileSync('backend/src/inventory/inventory.service.ts', s);
console.log('Patched inventory service');
