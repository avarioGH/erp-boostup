const fs = require('fs');
let s = fs.readFileSync('backend/src/crm/customer.service.ts', 'utf8');
s = s.replace(
  /async getCustomersWithReceivables\(\s*companyId: string,\s*search\?: string,\s*page: number = 1,\s*limit: number = 20,\s*\)/m,
  "async getCustomersWithReceivables(companyId: string, search?: string, page: number = 1, limit: number = 20, warehouseId?: string)"
);
s = s.replace(
  /const where: any = \{ company_id: companyId \};/,
  "const where: any = { company_id: companyId };\n    if (warehouseId) where.warehouse_id = warehouseId;"
);
fs.writeFileSync('backend/src/crm/customer.service.ts', s);

let c = fs.readFileSync('backend/src/crm/customer.controller.ts', 'utf8');
c = c.replace(
  /async getCustomers\([^)]+\) \{/m,
  "async getCustomers(@Request() req, @Query('page') page: string = '1', @Query('limit') limit: string = '10', @Query('search') search?: string, @Query('warehouse_id') warehouseId?: string) {"
);
c = c.replace(
  /return this\.customerService\.getCustomersWithReceivables\([\s\S]*?limitNum,[\s\S]*?\);/m,
  "return this.customerService.getCustomersWithReceivables(req.user.company_id || req.user.companyId, search, pageNum, limitNum, warehouseId);"
);
c = c.replace(
  /email: data\.email,\s*address: data\.address,/m,
  "email: data.email, address: data.address, warehouse_id: data.warehouse_id || undefined,"
);
fs.writeFileSync('backend/src/crm/customer.controller.ts', c);

console.log('Patched backend customers');
