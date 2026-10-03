const fs = require('fs');
let file = 'backend/src/inventory/disposal/disposal.service.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('reason: dto.reason,', 'reason: dto.reason || dto.notes || "Disposal",');
fs.writeFileSync(file, content);
