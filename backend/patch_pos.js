const fs = require('fs');
let code = fs.readFileSync('src/pos/pos.service.ts', 'utf8');

if (!code.includes('InventoryValuationEvent')) {
  code = code.replace(/import { SalesCompletedEvent } from '\.\.\/events\/sales-completed\.event';/, "import { SalesCompletedEvent } from '../events/sales-completed.event';\nimport { InventoryValuationEvent } from '../events/accounting.events';");
}

code = code.replace(/const { companyId, userId, warehouseId, customerId, paymentMethod, items, subtotal, tax, total } = data;/, "const { companyId, userId, warehouseId, customerId, paymentMethod, items, subtotal, tax, total } = data;\n    let totalPosCogs = 0;");

const findCogs = `            const { totalCogs } = await consumeFifoLayers(tx, {
              companyId,
              productId: item.productId,
              warehouseId,
              quantity: item.qty,
              stockMovementId: mov.id
            });`;
const repCogs = `            const { totalCogs } = await consumeFifoLayers(tx, {
              companyId,
              productId: item.productId,
              warehouseId,
              quantity: item.qty,
              stockMovementId: mov.id
            });
            totalPosCogs += totalCogs;`;
            
code = code.replace(findCogs, repCogs);

const findEmit = `      await this.eventEmitter.emitAsync(
        'sales.completed',
        new SalesCompletedEvent({
          companyId,
          sourceEntityId: salesOrder.id,
          payload: {
            totalAmount: total,
            paymentMethod: paymentMethod || 'CASH',
            userId
          },
          tx: tx as any
        })
      );`;
      
const repEmit = `      await this.eventEmitter.emitAsync(
        'sales.completed',
        new SalesCompletedEvent({
          companyId,
          sourceEntityId: salesOrder.id,
          payload: {
            totalAmount: total,
            paymentMethod: paymentMethod || 'CASH',
            userId
          },
          tx: tx as any
        })
      );

      // Emit COGS to accounting
      if (totalPosCogs > 0) {
        await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(
          companyId,
          'POS_SALE',
          salesOrder.id,
          {
            type: 'COGS',
            amount: totalPosCogs,
            description: 'COGS for POS ' + salesOrder.order_number,
            date: salesOrder.order_date
          },
          tx
        ));
      }`;

code = code.replace(findEmit, repEmit);
fs.writeFileSync('src/pos/pos.service.ts', code, 'utf8');
console.log('pos patched');
