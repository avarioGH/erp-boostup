const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/async postTransfer\(id: string\) \{/, "async postTransfer(id: string, companyId?: string) {");
  content = content.replace(/async cancelTransfer\(id: string\) \{/, "async cancelTransfer(id: string, companyId?: string) {");
  fs.writeFileSync(file, content);
}
fix('src/inventory/stock-transfer.service.ts');

function fix2(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/async postAdjustment\(id: string\) \{/, "async postAdjustment(id: string, companyId?: string) {");
  content = content.replace(/async cancelAdjustment\(id: string\) \{/, "async cancelAdjustment(id: string, companyId?: string) {");
  fs.writeFileSync(file, content);
}
fix2('src/inventory/stock-adjustment.service.ts');

