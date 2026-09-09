const fs = require('fs');
let content = fs.readFileSync('src/inventory/inventory.service.ts', 'utf8');

content = content.replace(
  /async updateCategory\(id: string, data: any\) \{/,
  "async updateCategory(companyId: string, id: string, data: any) {\n    const existing = await this.prisma.category.findFirst({ where: { id, company_id: companyId } });\n    if (!existing) throw new require('@nestjs/common').NotFoundException('Category not found');"
);

content = content.replace(
  /async deleteCategory\(id: string\) \{/,
  "async deleteCategory(companyId: string, id: string) {\n    const existing = await this.prisma.category.findFirst({ where: { id, company_id: companyId } });\n    if (!existing) throw new require('@nestjs/common').NotFoundException('Category not found');"
);

content = content.replace(
  /async updateWarehouse\(id: string, data: any\) \{/,
  "async updateWarehouse(companyId: string, id: string, data: any) {\n    const existing = await this.prisma.warehouse.findFirst({ where: { id, company_id: companyId } });\n    if (!existing) throw new require('@nestjs/common').NotFoundException('Warehouse not found');"
);

content = content.replace(
  /async deleteWarehouse\(id: string\) \{/,
  "async deleteWarehouse(companyId: string, id: string) {\n    const existing = await this.prisma.warehouse.findFirst({ where: { id, company_id: companyId } });\n    if (!existing) throw new require('@nestjs/common').NotFoundException('Warehouse not found');"
);

fs.writeFileSync('src/inventory/inventory.service.ts', content);
