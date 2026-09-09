const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

const wireOld = `eventEmitter.on('sales.completed', (evt) => accountingListener.handleSalesCompleted(evt));`;
const wireNew = `eventEmitter.on('sales.completed', (evt) => accountingListener.handleSalesCompleted(evt));\n    eventEmitter.on('inventory.valuation', (evt) => accountingListener.handleInventoryValuation(evt));`;

code = code.replace(wireOld, wireNew);
fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('patched event wire');
