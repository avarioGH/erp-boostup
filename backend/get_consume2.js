const fs = require('fs');
const lines = fs.readFileSync('src/manufacturing/mo/mo.service.ts', 'utf8').split('\n');
let inMethod = false;
let depth = 0;
let methodLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async consumeMaterials(')) inMethod = true;
  if (inMethod) {
    methodLines.push(lines[i]);
    if (lines[i].includes('{')) depth += (lines[i].match(/\{/g) || []).length;
    if (lines[i].includes('}')) depth -= (lines[i].match(/\}/g) || []).length;
    if (depth === 0 && methodLines.join('').includes('{')) {
      break;
    }
  }
}
console.log(methodLines.join('\n'));
