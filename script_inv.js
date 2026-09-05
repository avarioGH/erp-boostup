const fs = require('fs');
const file = 'backend/src/finance/invoice/invoice.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Add import
if (!code.includes('InvoicePostedEvent')) {
  code = "import { InvoicePostedEvent } from '../../events/accounting.events';\n" + code;
}

// Post Invoice
code = code.replace(
  "return invoice;",
  "await this.eventEmitter.emitAsync('invoice.posted', new InvoicePostedEvent(companyId, invoice.id, 'EVT-' + Date.now(), new Date(), { type: invoice.type === 'VENDOR_BILL' ? 'VENDOR_BILL' : 'SALES_INVOICE', totalAmount: invoice.total_amount }, tx));\n        return invoice;"
);

fs.writeFileSync(file, code);
