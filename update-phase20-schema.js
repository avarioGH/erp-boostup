const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

const regexes = [
  { re: /model Company \{[\s\S]*?\}/, add: `  timberPurchases TimberPurchase[]\n  timberShipments TimberShipment[]\n}` },
  { re: /model TimberSource \{[\s\S]*?\}/, add: `  timberPurchases TimberPurchase[]\n}` },
  { re: /model Warehouse \{[\s\S]*?\}/, add: `  timberPurchases TimberPurchase[]\n  timberShipments TimberShipment[]\n}` },
  { re: /model Vehicle \{[\s\S]*?\}/, add: `  timberShipments TimberShipment[]\n}` },
  { re: /model Driver \{[\s\S]*?\}/, add: `  timberShipments TimberShipment[]\n}` },
  { re: /model Customer \{[\s\S]*?\}/, add: `  timberShipments TimberShipment[]\n}` },
  { re: /model TimberVariant \{[\s\S]*?\}/, add: `  timberPurchaseItems TimberPurchaseItem[]\n  timberShipmentItems TimberShipmentItem[]\n}` }
];

for (const r of regexes) {
  content = content.replace(r.re, (match) => {
    if (match.includes(r.add.split('\n')[0])) return match; // rudimentary check
    return match.replace(/}$/, r.add);
  });
}

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Done extending existing models for Phase 20');
