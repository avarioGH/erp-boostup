const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

code = code.replace(/account_code: '1400', account_name: 'Inventory'/, "account_code: '1300', account_name: 'Inventory Asset'");
code = code.replace(/account_code: '4000', account_name: 'Sales'/, "account_code: '4000', account_name: 'Sales Revenue'");

// Also seed WIP
const cogsRow = `{ id: '600000000000000000000102', company_id: c1, account_code: '5000', account_name: 'COGS', account_type_id: at },`;
const newRow = `{ id: '600000000000000000000105', company_id: c1, account_code: '1400', account_name: 'WIP', account_type_id: at },\n      ` + cogsRow;
code = code.replace(cogsRow, newRow);

fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('patched test accounts');
