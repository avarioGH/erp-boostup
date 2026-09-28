const fs = require('fs');
let s = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const match = s.match(/model Company \{[\s\S]*?\n\}/);
if (match) {
  s = s.replace(match[0], match[0].replace(/\n\}$/, '\n  timberVariants TimberVariant[]\n}'));
}
fs.writeFileSync('backend/prisma/schema.prisma', s);
console.log('Fixed Company');
