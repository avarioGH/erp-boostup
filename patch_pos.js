const fs = require("fs");
let content = fs.readFileSync("backend/src/pos/pos.service.ts", "utf8");

content = content.replace("total_amount: total ?? items.reduce((s: number, i: any) => s + i.qty * i.price, 0),", 
`total_amount: total ?? items.reduce((s: number, i: any) => s + i.qty * i.price, 0),`);
// wait, I need to compute total_amount properly.
const logicReplace = `const totalAmount = total ?? items.reduce((s: number, i: any) => s + i.qty * i.price, 0);
      const paidAmount = data.paidAmount !== undefined ? data.paidAmount : totalAmount;
      
      let initialPaymentStatus = 'UNPAID';
      if (paidAmount >= totalAmount - 0.01) initialPaymentStatus = 'PAID';
      else if (paidAmount > 0) initialPaymentStatus = 'PARTIALLY_PAID';

      const salesOrder = await tx.salesOrder.create({
        data: {
          company_id: companyId,
          order_number: soNo,
          ecommerce_session_id: idempotency_key,
          customer_id: customerId,
          order_date: new Date(),
          status: 'COMPLETED',
          total_amount: totalAmount,
          payment_status: initialPaymentStatus,
          payment_method: paymentMethod || 'CASH',
        }
      });`;

content = content.replace(/const salesOrder = await tx\.salesOrder\.create\(\{[\s\S]*?\}\);/, logicReplace);

const financeReplace = `// 3. Create Payment and Finance Transaction if paid
      if (paidAmount > 0) {
        const payment = await tx.payment.create({
          data: {
            company_id: companyId,
            customer_id: customerId || undefined,
            payment_number: "POS-" + Date.now(),
            payment_date: new Date(),
            amount: paidAmount,
            payment_method: paymentMethod || 'CASH',
            notes: "POS Checkout",
            created_by: userId
          }
        });

        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            sales_order_id: salesOrder.id,
            amount: paidAmount
          }
        });

        const cashAccount = await tx.cashAccount.findFirst({
          where: { company_id: companyId }
        });

        if (cashAccount) {
          await tx.financeTransaction.create({
            data: {
              company_id: companyId,
              cash_account_id: cashAccount.id,
              transaction_no: \`TRX-\${Date.now()}\`,
              transaction_type: 'Income',
              transaction_date: new Date(),
              total_amount: paidAmount, // Real cash received
              reference_type: 'PAYMENT',
              reference_id: payment.id,
              description: \`Penjualan POS #\${soNo}\`,
              status: 'COMPLETED',
              created_by: userId,
            }
          });
        }
      }`;

content = content.replace(/\/\/ 3\. Finance Transaction \(Add Revenue\)[\s\S]*?\}\n\n      \}/, financeReplace);

fs.writeFileSync("backend/src/pos/pos.service.ts", content);

