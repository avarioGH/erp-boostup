const fs = require('fs');
const lines = fs.readFileSync('src/purchasing/purchasing.service.ts', 'utf8').split('\n');
let inMethod = false;
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async receiveGoods(')) inMethod = true;
  if (inMethod) {
    console.log(lines[i]);
    if (lines[i].includes('{')) depth += (lines[i].match(/\{/g) || []).length;
    if (lines[i].includes('}')) depth -= (lines[i].match(/\}/g) || []).length;
    if (depth === 0) break;
  }
}
