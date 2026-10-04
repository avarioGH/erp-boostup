const fs = require('fs');

// 1. POS Service & Controller
let pc = fs.readFileSync('backend/src/pos/pos.controller.ts', 'utf8');
pc = pc.replace(
  /async getHistory\(@Request\(\) req\)/g, 
  "async getHistory(@Request() req, @Query('warehouseId') warehouseId?: string)"
);
pc = pc.replace(
  /this\.posService\.getHistory\(req\.user\.company_id\)/g,
  "this.posService.getHistory(req.user.company_id, warehouseId)"
);
// Import Query if not present
if (!pc.includes('@Query')) {
  pc = pc.replace(/@Get,/g, '@Get, @Query,');
}
fs.writeFileSync('backend/src/pos/pos.controller.ts', pc);

let ps = fs.readFileSync('backend/src/pos/pos.service.ts', 'utf8');
ps = ps.replace(
  /async getHistory\(companyId: string\)/g,
  "async getHistory(companyId: string, warehouseId?: string)"
);
ps = ps.replace(
  /where: \{ company_id: companyId \}/g,
  "where: { company_id: companyId, ...(warehouseId ? { warehouse_id: warehouseId } : {}) }"
);
fs.writeFileSync('backend/src/pos/pos.service.ts', ps);

// 2. Analytics Service & Controller
let ac = fs.readFileSync('backend/src/analytics/analytics.controller.ts', 'utf8');
ac = ac.replace(
  /@Query\('endDate'\) endDate\?: string,/g,
  "@Query('endDate') endDate?: string,\n    @Query('warehouseId') warehouseId?: string,"
);
ac = ac.replace(
  /endDate,\s+\);/g,
  "endDate,\n      warehouseId,\n    );"
);
fs.writeFileSync('backend/src/analytics/analytics.controller.ts', ac);

let as = fs.readFileSync('backend/src/analytics/analytics.service.ts', 'utf8');
as = as.replace(
  /async getSalesAnalytics\(\s+companyId: string,\s+startDate\?: string,\s+endDate\?: string,\s+\)/g,
  "async getSalesAnalytics(companyId: string, startDate?: string, endDate?: string, warehouseId?: string)"
);
as = as.replace(
  /where: \{\s+company_id: companyId,\s+order_date/g,
  "where: {\n      company_id: companyId,\n      ...(warehouseId ? { warehouse_id: warehouseId } : {}),\n      order_date"
);
// Total Revenue fallback
as = as.replace(
  /const totalRevenue = await this\.prisma\.salesOrder\.aggregate\(\{\s+where: \{\s+company_id: companyId,\s+status: 'COMPLETED',\s+\},/g,
  "const totalRevenue = await this.prisma.salesOrder.aggregate({\n      where: {\n        company_id: companyId,\n        ...(warehouseId ? { warehouse_id: warehouseId } : {}),\n        status: 'COMPLETED',\n      },"
);
// Recent transactions fallback
as = as.replace(
  /const recentTransactions = await this\.prisma\.salesOrder\.findMany\(\{\s+where: \{\s+company_id: companyId,\s+\},/g,
  "const recentTransactions = await this.prisma.salesOrder.findMany({\n      where: {\n        company_id: companyId,\n        ...(warehouseId ? { warehouse_id: warehouseId } : {}),\n      },"
);
fs.writeFileSync('backend/src/analytics/analytics.service.ts', as);

// 3. Timber Sales Controller & Service
let tc = fs.readFileSync('backend/src/sales/timber-sales.controller.ts', 'utf8');
tc = tc.replace(
  /@Query\('customerId'\) customerId\?: string,/g,
  "@Query('customerId') customerId?: string,\n      @Query('warehouseId') warehouseId?: string,"
);
tc = tc.replace(
  /customerId,\s+\);/g,
  "customerId,\n      warehouseId\n    );"
);
fs.writeFileSync('backend/src/sales/timber-sales.controller.ts', tc);

let ts = fs.readFileSync('backend/src/sales/timber-sales.service.ts', 'utf8');
ts = ts.replace(
  /async findAllOrders\(\s+companyId: string,\s+page: number,\s+limit: number,\s+status\?: string,\s+customerId\?: string,\s+\) \{/g,
  "async findAllOrders(\n    companyId: string,\n    page: number,\n    limit: number,\n    status?: string,\n    customerId?: string,\n    warehouseId?: string\n  ) {"
);
ts = ts.replace(
  /company_id: companyId,\s+\.\.\.\(status \? \{ status \} : \{\}\),\s+\.\.\.\(customerId \? \{ customer_id: customerId \} : \{\}\),\s+\}/g,
  "company_id: companyId,\n      ...(status ? { status } : {}),\n      ...(customerId ? { customer_id: customerId } : {}),\n      ...(warehouseId ? { warehouse_id: warehouseId } : {})\n    }"
);
fs.writeFileSync('backend/src/sales/timber-sales.service.ts', ts);

console.log('Patched backend to filter by warehouseId');
