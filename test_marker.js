const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
console.log(code.includes('model Company {'));
console.log(code.includes('attachments Attachment[]'));
