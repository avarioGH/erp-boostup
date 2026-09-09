const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

const moDraftStr = `await moService.startProduction(c1, mo.id, sys);`;
const moConfStr = `await moService.updateManufacturingOrderStatus(c1, mo.id, 'CONFIRMED', sys);\n      await moService.startProduction(c1, mo.id, sys);`;
code = code.replace(moDraftStr, moConfStr);

fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('mo runner patched');
