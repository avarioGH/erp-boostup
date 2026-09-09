const fs = require('fs');
let code = fs.readFileSync('backend/src/attachment/attachment.service.ts', 'utf8');
code = code.replace(
  /case 'CUSTOMER':\s*case 'SUPPLIER':\s*\/\/.*?\s*exists = !!\(await this\.prisma\.partner.*?\);\s*break;/,
  \case 'CUSTOMER':
        exists = !!(await this.prisma.customer.findFirst({ where: { id: entityId, company_id: companyId } }));
        break;
      case 'SUPPLIER':
        exists = !!(await this.prisma.supplier.findFirst({ where: { id: entityId, company_id: companyId } }));
        break;\
);
fs.writeFileSync('backend/src/attachment/attachment.service.ts', code, 'utf8');
