const fs = require('fs');
let code = fs.readFileSync('backend/src/crm/quotation/sales-order.controller.ts', 'utf8');

const target = `    }); // End of SO transaction

    // Delegate B2B Upfront Payment to Canonical PaymentService
    if (paidAmount > 0) {`;

const replacement = `      return order;
    }); // End of SO transaction

    // Delegate B2B Upfront Payment to Canonical PaymentService
    if (paidAmount > 0) {`;

code = code.replace(target, replacement);
code = code.replace(/if \(refreshedSO\) so\.payment_status = refreshedSO\.payment_status;\n    \}\n\n    return;/g, 
`if (refreshedSO) so.payment_status = refreshedSO.payment_status;\n    }\n\n    return so;`);

fs.writeFileSync('backend/src/crm/quotation/sales-order.controller.ts', code);
console.log('Fixed return statements');
