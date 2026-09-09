const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const marker = 'model BomItem {';
const lines = code.split('\n');
let inModel = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(marker)) inModel = true;
  if (inModel && lines[i].includes('quantity Float?')) {
    lines.splice(i, 1);
    break;
  }
  if (inModel && lines[i].includes('}')) inModel = false;
}
fs.writeFileSync('prisma/schema.prisma', lines.join('\n'), 'utf8');
