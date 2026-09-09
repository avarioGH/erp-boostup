const fs = require('fs');

// Fix attachment controller
let ac = fs.readFileSync('backend/src/attachment/attachment.controller.ts', 'utf8');
ac = ac.replace(/res\.set\(\{[\s\S]*?\}\);/, "res.set({ 'Content-Type': mimeType, 'Content-Disposition': 'attachment; filename=\"' + fileName + '\"', 'Content-Length': buffer.length });");
fs.writeFileSync('backend/src/attachment/attachment.controller.ts', ac, 'utf8');

// Fix notification service
let ns = fs.readFileSync('backend/src/notification/notification.service.ts', 'utf8');
ns = ns.replace(/this\.logger\.debug\(.*Skipping duplicate.*\);/, "this.logger.debug('Skipping duplicate notification: ' + data.idempotencyKey);");
fs.writeFileSync('backend/src/notification/notification.service.ts', ns, 'utf8');
