const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
code = code.replace(/attachments Attachment\[\]/, "attachments Attachment[]\n  notifications Notification[]");
fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
