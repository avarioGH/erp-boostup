const fs = require('fs');
let s = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

s = s.replace(/timberStockReservations TimberStockReservation\[\]\s*\}\s*model CompanySetting/, 'timberStockReservations TimberStockReservation[]\n  @@unique([company_id, sku])\n}\n\nmodel CompanySetting');

fs.writeFileSync('backend/prisma/schema.prisma', s);
console.log('Fixed');
