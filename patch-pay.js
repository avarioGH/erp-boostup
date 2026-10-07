const fs = require('fs');
let code = fs.readFileSync('backend/src/finance/payment/payment.service.ts', 'utf8');

const target = `          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              remaining_amount: newRemaining,
              paid_amount: newPaid,
              status: newStatus,
            },
          });
        }`;

const replacement = `          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              remaining_amount: newRemaining,
              paid_amount: newPaid,
              status: newStatus,
            },
          });
          
          if (inv.purchase_order_id) {
            const allInvs = await tx.invoice.findMany({
              where: { purchase_order_id: inv.purchase_order_id, type: { in: ['AP', 'VENDOR_BILL'] } },
            });
            // We need to account for the current update since the transaction hasn't committed? 
            // Wait, Prisma tx will see the updated row if we await. We did await above.
            const allPaid = allInvs.every((i: any) => i.status === 'PAID');
            const anyPaid = allInvs.some((i: any) => i.paid_amount > 0);
            
            await tx.purchaseOrder.update({
              where: { id: inv.purchase_order_id },
              data: {
                payment_status: allPaid ? 'PAID' : anyPaid ? 'PARTIALLY_PAID' : 'UNPAID',
              },
            });
          }
        }`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/src/finance/payment/payment.service.ts', code);
console.log('payment.service.ts patched');
