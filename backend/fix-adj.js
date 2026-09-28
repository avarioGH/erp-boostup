const fs = require('fs');
let file = 'src/inventory/stock-adjustment.service.ts';
let content = fs.readFileSync(file, 'utf8');

// listAdjustments
content = content.replace(/async listAdjustments\(params: \{ skip\?: number; take\?: number; search\?: string; status\?: string \}\) \{/,
  "async listAdjustments(params: { companyId: string; skip?: number; take?: number; search?: string; status?: string }) {");
content = content.replace(/const \{ skip = 0, take = 50, search, status \} = params;\s+const where: any = \{\};/,
  "const { skip = 0, take = 50, search, status, companyId } = params;\n    const where: any = { location: { company_id: companyId } };");

// getAdjustment
content = content.replace(/async getAdjustment\(id: string\) \{/, "async getAdjustment(id: string, companyId: string) {");
content = content.replace(/where: \{ id \},/, "where: { id, location: { company_id: companyId } },");

fs.writeFileSync(file, content);
