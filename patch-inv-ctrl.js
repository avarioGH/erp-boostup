const fs = require('fs');
let s = fs.readFileSync('backend/src/inventory/inventory.controller.ts', 'utf8');

s = s.replace(
  /@Get\('stocks'\)\n\s*async getStocks\(@Request\(\) req\) \{\n\s*return this\.inventoryService\.getWarehouseStocks\(req\.user\.company_id\);\n\s*\}/,
  `@Get('stocks')
  async getStocks(@Request() req, @Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getWarehouseStocks(req.user.company_id, warehouseId);
  }`
);

fs.writeFileSync('backend/src/inventory/inventory.controller.ts', s);
console.log('Patched inventory controller');
