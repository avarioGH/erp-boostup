const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
// Fix stockMovementId arguments to valid ObjectIds
code = code.split("stockMovementId: 'sm_A'").join("stockMovementId: '000000000000000000000001'");
code = code.split("stockMovementId: 'sm_B'").join("stockMovementId: '000000000000000000000002'");
code = code.split("stockMovementId: 'sm_C'").join("stockMovementId: '000000000000000000000003'");
code = code.split("stockMovementId: 'sm_D'").join("stockMovementId: '000000000000000000000004'");
code = code.split("stockMovementId: 'sm_E'").join("stockMovementId: '000000000000000000000005'");
code = code.split("stockMovementId: 'sm_U'").join("stockMovementId: '000000000000000000000006'");
code = code.split("stockMovementId: 's_inv'").join("stockMovementId: '000000000000000000000007'");
code = code.split("sourceMovementId: 's1'").join("sourceMovementId: '000000000000000000000008'");
code = code.split("destMovementId: 's2'").join("destMovementId: '000000000000000000000009'");
fs.writeFileSync('test/final.certification.ts', code);
console.log('done');
