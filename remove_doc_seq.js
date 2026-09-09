const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
code = code.replace('  document_sequences DocumentSequence[]\n', '');
fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
