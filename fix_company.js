const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
if (!code.includes('notifications Notification[]')) {
  code = code.replace(/model Company \{/, "model Company {\n  notifications Notification[]");
  fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
}
