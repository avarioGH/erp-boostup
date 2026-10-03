const fs = require('fs');
let file = 'backend/src/pos/pos.service.ts';
let content = fs.readFileSync(file, 'utf8');

const oldEvent = `      // 5. Emit Domain Event for Accounting Integration
      // Using async Emit (waiting for handlers to complete within this transaction boundary)
      await this.eventEmitter.emitAsync(
        'sales.completed',
        new SalesCompletedEvent({
          companyId,
          sourceEntityId: salesOrder.id,
          payload: {
            totalAmount: salesOrder.total_amount,
            paymentMethod: paymentMethod || 'CASH',
            userId,
          },
          tx: tx as any,
        }),
      );`;

const newEvent = `      // 5. Emit Domain Event for Accounting Integration
      // Using async Emit (waiting for handlers to complete within this transaction boundary)
      await this.eventEmitter.emitAsync(
        'sales.completed',
        new SalesCompletedEvent({
          companyId,
          sourceEntityId: salesOrder.id,
          payload: {
            totalAmount: salesOrder.total_amount,
            paidAmount: paidAmount, // Pass paidAmount to handle piutang
            paymentMethod: paymentMethod || 'CASH',
            userId,
          },
          tx: tx as any,
        }),
      );`;

content = content.replace(oldEvent, newEvent);
fs.writeFileSync(file, content);
console.log('Patched sales.completed event payload');
