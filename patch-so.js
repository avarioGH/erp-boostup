const fs = require('fs');
let code = fs.readFileSync('backend/src/crm/quotation/sales-order.controller.ts', 'utf8');

if (!code.includes('import { PaymentService }')) {
  code = "import { PaymentService } from '../../finance/payment/payment.service';\n" + code;
}

code = code.replace(
  'constructor(private prisma: PrismaService) {}',
  'constructor(private prisma: PrismaService, private paymentService: PaymentService) {}'
);

const startIdx = code.indexOf('if (paidAmount > 0) {');
const endIdx = code.indexOf('return order;', startIdx);

const replacement = `
      }); // End of SO transaction

      // Delegate B2B Upfront Payment to Canonical PaymentService
      if (paidAmount > 0) {
        await this.paymentService.create(
          compId,
          {
            salesOrderId: so.id,
            customerId: body.customer_id,
            amount: paidAmount,
            paymentMethod: body.payment_method || 'Transfer',
            reference: orderNo,
            notes: \`Upfront B2B Payment \${orderNo}\`,
            allowUnallocated: true // Allow just SO allocation
          },
          req.user.id
        );
        // Refresh SO state to reflect updated payment status from PaymentService
        const refreshedSO = await this.prisma.salesOrder.findUnique({ where: { id: so.id }});
        if (refreshedSO) so.payment_status = refreshedSO.payment_status;
      }

      return `;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx + 'return order;\n      });\n\n      return '.length);

fs.writeFileSync('backend/src/crm/quotation/sales-order.controller.ts', code);
console.log('sales-order.controller.ts patched');
