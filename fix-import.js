const fs = require('fs');
let s = fs.readFileSync('backend/src/inventory/inventory.controller.ts', 'utf8');

if (!s.includes(' Query,')) {
  s = s.replace(/import \{(\s*)Controller,/g, "import {$1Controller,\n  Query,");
}

fs.writeFileSync('backend/src/inventory/inventory.controller.ts', s);
console.log('Fixed Query import');
