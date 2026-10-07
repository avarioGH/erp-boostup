const fs = require('fs');
let s = fs.readFileSync('backend/src/pos/pos.service.ts', 'utf8');

// Undo bad patch
s = s.replace(
  /const salesOrder = await tx\.salesOrder\.create\(\{\n\s*data: \{\n\s*company_id: companyId,\n\s*warehouse_id: resolvedWarehouseId,\n\s*order_number: soNo,/,
  `const salesOrder = await tx.salesOrder.create({
          data: {
            company_id: companyId,
            warehouse_id: resolvedWarehouseId,
            order_number: soNo,`
); // Actually it's still using resolvedWarehouseId

s = s.replace(
  /const _posResult = await this\.prisma\.\$transaction\(async \(tx\) => \{/,
  `const _posResult = await this.prisma.$transaction(async (tx) => {
        let resolvedWarehouseId = warehouseId;
        if (!resolvedWarehouseId) {
          const defaultWh = await tx.warehouse.findFirst({ where: { company_id: companyId } });
          resolvedWarehouseId = defaultWh?.id;
        }`
);

s = s.replace(
  /\/\/ Resolve warehouseId — use provided or fall back to first warehouse for company\n\s*let resolvedWarehouseId = warehouseId;\n\s*if \(!resolvedWarehouseId\) \{\n\s*const defaultWh = await tx\.warehouse\.findFirst\(\{\n\s*where: \{ company_id: companyId \},\n\s*\}\);\n\s*resolvedWarehouseId = defaultWh\?\.id;\n\s*\}/g,
  ""
);

// wait the text has special character "—"
const fallbackRegex = /\/\/ Resolve warehouseId.*?resolvedWarehouseId = defaultWh\?\.id;\n\s*\}/gs;
s = s.replace(fallbackRegex, "");

fs.writeFileSync('backend/src/pos/pos.service.ts', s);
console.log('Fixed POS scope');
