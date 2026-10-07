const fs = require('fs');
let code = fs.readFileSync('backend/src/inventory/fifo.engine.ts', 'utf8');
const start = code.indexOf('if (remainingToConsume > 0');
const end = code.indexOf('return { consumed, totalCogs };');
code = code.substring(0, start) + 
"if (remainingToConsume > 0.0001) {\n" +
"    throw new Error(\n" +
"      `INSUFFICIENT_INVENTORY_COST_LAYER: Inventory quantity exists but historical cost layers are insufficient for this quantity (short by ${remainingToConsume}). Inventory valuation reconciliation is required before this transaction can be posted.`\n" +
"    );\n" +
"  }\n\n  " + code.substring(end);
fs.writeFileSync('backend/src/inventory/fifo.engine.ts', code);
