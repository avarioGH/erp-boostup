const fs = require('fs');

// Fix HR Controller (Query import)
let hrC = fs.readFileSync('backend/src/hr/hr.controller.ts', 'utf8');
hrC = hrC.replace(/import \{/, 'import { Query, Param,');
fs.writeFileSync('backend/src/hr/hr.controller.ts', hrC);

// Fix HR Service (net_pay -> net_salary, results type)
let hrS = fs.readFileSync('backend/src/hr/hr.service.ts', 'utf8');
hrS = hrS.replace(/net_pay:/g, 'net_salary:');
hrS = hrS.replace(/const results = \[\];/g, 'const results: any[] = [];');
fs.writeFileSync('backend/src/hr/hr.service.ts', hrS);

// Fix fish-purchase.service.ts (remove total from InvoiceItem)
let fpS = fs.readFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', 'utf8');
fpS = fpS.replace(/total: item\.qty \* item\.unit_price,/g, '');
fs.writeFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', fpS);

console.log('Fixed backend compilation errors');
