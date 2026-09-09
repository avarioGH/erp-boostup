const fs = require('fs');
let code = fs.readFileSync('backend/src/attachment/attachment.service.ts', 'utf8');
code = code.replace(/throw new ForbiddenException\(.*not found.*/, "throw new ForbiddenException('Entity ' + entityType + ' ' + entityId + ' not found or does not belong to company');");
fs.writeFileSync('backend/src/attachment/attachment.service.ts', code, 'utf8');
