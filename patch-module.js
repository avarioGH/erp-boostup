const fs = require('fs');
let code = fs.readFileSync('backend/src/crm/quotation/quotation.module.ts', 'utf8');
if (!code.includes('PaymentModule')) {
  code = "import { PaymentModule } from '../../finance/payment/payment.module';\n" + code;
  code = code.replace('imports: [', 'imports: [PaymentModule, ');
  if (!code.includes('imports: [')) {
    code = code.replace('@Module({', '@Module({\n  imports: [PaymentModule],');
  }
  fs.writeFileSync('backend/src/crm/quotation/quotation.module.ts', code);
  console.log('QuotationModule updated');
}
