const fs = require('fs');
let content = fs.readFileSync('src/inventory/inventory.controller.ts', 'utf8');

content = content.replace(
  /async updateCategory\(@Param\('id'\) id: string, @Body\(\) data: any\) \{[\s\S]*?this\.inventoryService\.updateCategory\(id, data\);[\s\S]*?\}/,
  "async updateCategory(@Request() req: any, @Param('id') id: string, @Body() data: any) {\n    return this.inventoryService.updateCategory(req.user.company_id, id, data);\n  }"
);

content = content.replace(
  /async deleteCategory\(@Param\('id'\) id: string\) \{[\s\S]*?this\.inventoryService\.deleteCategory\(id\);[\s\S]*?\}/,
  "async deleteCategory(@Request() req: any, @Param('id') id: string) {\n    return this.inventoryService.deleteCategory(req.user.company_id, id);\n  }"
);

content = content.replace(
  /async updateWarehouse\(@Param\('id'\) id: string, @Body\(\) data: any\) \{[\s\S]*?this\.inventoryService\.updateWarehouse\(id, data\);[\s\S]*?\}/,
  "async updateWarehouse(@Request() req: any, @Param('id') id: string, @Body() data: any) {\n    return this.inventoryService.updateWarehouse(req.user.company_id, id, data);\n  }"
);

content = content.replace(
  /async deleteWarehouse\(@Param\('id'\) id: string\) \{[\s\S]*?this\.inventoryService\.deleteWarehouse\(id\);[\s\S]*?\}/,
  "async deleteWarehouse(@Request() req: any, @Param('id') id: string) {\n    return this.inventoryService.deleteWarehouse(req.user.company_id, id);\n  }"
);

fs.writeFileSync('src/inventory/inventory.controller.ts', content);
