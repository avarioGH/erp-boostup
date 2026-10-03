const fs = require('fs');
let file = 'backend/src/inventory/disposal/disposal.service.ts';
let content = fs.readFileSync(file, 'utf8');

// The original line was: company_id: dto.companyId,
content = content.replace('company_id: dto.companyId,', 'company_id: dto.companyId as string,');
content = content.replace('where: { company_id: dto.companyId },', 'where: { company_id: dto.companyId as string },');

fs.writeFileSync(file, content);
