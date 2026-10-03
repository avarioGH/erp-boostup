const fs = require('fs');
let file = 'backend/src/pos/pos.service.ts';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `      // 3. Finance Transaction (Add Revenue)
      const cashAccount = await tx.cashAccount.findFirst({
        where: { company_id: companyId },
      });

      if (cashAccount) {
        await tx.financeTransaction.create({
          data: {
            company_id: companyId,
            cash_account_id: cashAccount.id,
            transaction_no: \`TRX-\${Date.now()}\`,
            transaction_type: 'Income',
            transaction_date: new Date(),
            total_amount: total,
            reference_type: 'POS',
            reference_id: salesOrder.id,
            description: \`Penjualan POS #\${soNo}\`,
            status: 'COMPLETED',
            created_by: userId,
          },
        });
      }`;

const newBlock = `      // 3. Payment & Finance Transaction
      const cashAccount = await tx.cashAccount.findFirst({
        where: { company_id: companyId },
      });

      if (paidAmount > 0) {
        const payment = await tx.payment.create({
          data: {
            company_id: companyId,
            customer_id: customerId || undefined,
            payment_number: 'PAY-' + Date.now(),
            payment_date: new Date(),
            amount: paidAmount,
            payment_method: paymentMethod || 'CASH',
            reference: \`POS Sale \${soNo}\`,
            created_by: userId || '000000000000000000000000'
          }
        });

        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            sales_order_id: salesOrder.id,
            amount: paidAmount
          }
        });

        if (cashAccount) {
          await tx.financeTransaction.create({
            data: {
              company_id: companyId,
              cash_account_id: cashAccount.id,
              transaction_no: \`TRX-\${Date.now()}\`,
              transaction_type: 'Income',
              transaction_date: new Date(),
              total_amount: paidAmount,
              reference_type: 'POS',
              reference_id: salesOrder.id,
              description: \`Pembayaran POS #\${soNo}\`,
              status: 'COMPLETED',
              created_by: userId,
            },
          });
        }
      }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(file, content);
console.log('Patched pos.service.ts');
