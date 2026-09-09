const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

code = code.replace("eventEmitter.on('delivery.validated', (evt) => accountingListener.handleDeliveryValidated(evt));", "");

fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('patched runner listener');
