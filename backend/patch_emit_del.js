const fs = require('fs');
let code = fs.readFileSync('src/crm/delivery/delivery.service.ts', 'utf8');

code = code.replace(/this\.eventEmitter\.emit\('inventory\.valuation'/g, "await this.eventEmitter.emitAsync('inventory.valuation'");
code = code.replace(/this\.eventEmitter\.emit\('delivery\.validated'/g, "await this.eventEmitter.emitAsync('delivery.validated'");

fs.writeFileSync('src/crm/delivery/delivery.service.ts', code, 'utf8');
console.log('patched emitAsync');
