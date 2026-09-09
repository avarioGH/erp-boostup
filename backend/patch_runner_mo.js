const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

const moConfStr = `await moService.updateManufacturingOrderStatus(c1, mo.id, 'CONFIRMED', sys);\n      await moService.startProduction(c1, mo.id, sys);`;
const prismaUpdStr = `await prisma.manufacturingOrder.update({ where: { id: mo.id }, data: { status: 'CONFIRMED' } });\n      await moService.startProduction(c1, mo.id, sys);`;

code = code.replace(moConfStr, prismaUpdStr);
fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('patched mo test logic');
