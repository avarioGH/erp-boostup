const fs = require('fs');
let file = 'src/inventory/stock-transfer.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/async listTransfers\(params: \{/, "async listTransfers(params: { companyId: string; ");
content = content.replace(/const \{ skip = 0, take = 50, search, status, fromLocationId, toLocationId, startDate, endDate, fromLocationCodePrefix, toLocationCodePrefix \} = params;\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, status, fromLocationId, toLocationId, startDate, endDate, fromLocationCodePrefix, toLocationCodePrefix, companyId } = params;\n    const where: any = { fromLocation: { company_id: companyId } };");

content = content.replace(/async getTransfer\(id: string\) \{/, "async getTransfer(id: string, companyId: string) {");
content = content.replace(/where: \{ id \},/, "where: { id, fromLocation: { company_id: companyId } },");

fs.writeFileSync(file, content);
