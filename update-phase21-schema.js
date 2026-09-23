const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

const regexes = [
  { re: /model Company \{[\s\S]*?\}/, add: `  timberStockOpnames TimberStockOpname[]\n}` },
  { re: /model Warehouse \{[\s\S]*?\}/, add: `  timberStockOpnames TimberStockOpname[]\n}` },
  { re: /model TimberVariant \{[\s\S]*?\}/, add: `  timberStockOpnameItems TimberStockOpnameItem[]\n}` }
];

for (const r of regexes) {
  content = content.replace(r.re, (match) => {
    if (match.includes(r.add.split('\n')[0])) return match; // rudimentary check
    return match.replace(/}$/, r.add);
  });
}

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Done extending existing models for Phase 21');
