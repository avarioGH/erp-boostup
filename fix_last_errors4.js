const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(/quality_checks QualityCheck\[\]\n/g, '');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
