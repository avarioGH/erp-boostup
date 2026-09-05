const fs = require('fs');

// Fix controller
const controllerFile = 'backend/src/finance/payment/payment.controller.ts';
let codeC = fs.readFileSync(controllerFile, 'utf8');
codeC = codeC.replace("data.invoiceId, data);", "data);");
fs.writeFileSync(controllerFile, codeC);

// Fix service
const serviceFile = 'backend/src/finance/payment/payment.service.ts';
let codeS = fs.readFileSync(serviceFile, 'utf8');
codeS = codeS.replace("description: `Payment for invoice ${invoice.invoice_number}`", "description: `Payment for invoice ${invoice.invoice_number}`, created_by: 'SYSTEM'");
fs.writeFileSync(serviceFile, codeS);
