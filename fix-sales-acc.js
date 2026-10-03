const fs = require('fs');

// Fix 1: Sales Order constraint
let soFile = 'backend/src/crm/quotation/sales-order.controller.ts';
let soContent = fs.readFileSync(soFile, 'utf8');
soContent = soContent.replace(
  'company_id: compId,',
  'company_id: compId,\n          ecommerce_session_id: "MANUAL_" + Date.now() + Math.random().toString(36).substring(7),'
);
fs.writeFileSync(soFile, soContent);

// Fix 2: AccountType missing company_id
let accFile = 'backend/src/accounting/accounting.listener.ts';
let accContent = fs.readFileSync(accFile, 'utf8');
accContent = accContent.replace(
  'name: \'Auto Generated\',',
  'company_id: companyId,\n          name: \'Auto Generated\','
);
fs.writeFileSync(accFile, accContent);
console.log('Fixed sales order constraint and account type creation');
