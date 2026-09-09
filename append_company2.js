const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(
  'model Company {\n',
  'model Company {\n  attachments Attachment[]\n  notifications Notification[]\n'
);

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
