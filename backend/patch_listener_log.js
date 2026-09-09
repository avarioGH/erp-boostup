const fs = require('fs');
let code = fs.readFileSync('src/accounting/accounting.listener.ts', 'utf8');

code = code.replace(/async handleInventoryValuation\(event: InventoryValuationEvent\) \{\n      try \{/, "async handleInventoryValuation(event: InventoryValuationEvent) {\n      try {\n        console.log('--- HANDLE INVENTORY VALUATION CALLED ---');");

fs.writeFileSync('src/accounting/accounting.listener.ts', code, 'utf8');
