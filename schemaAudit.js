const fs = require('fs');
const schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const tpi = schema.substring(schema.indexOf('model TimberPurchaseItem'), schema.indexOf('model TimberPurchaseLogItem'));
console.log("TimberPurchaseItem:");
console.log(tpi);

const tpli = schema.substring(schema.indexOf('model TimberPurchaseLogItem'), schema.indexOf('model TimberShipment'));
console.log("TimberPurchaseLogItem:");
console.log(tpli);
