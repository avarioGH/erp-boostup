const fs = require('fs');

// Fix Delivery
let delCode = fs.readFileSync('src/crm/delivery/delivery.service.ts', 'utf8');
const oldDelEvent = `      this.eventEmitter.emit('inventory.valuation', new InventoryValuationEvent(
        companyId,
        'DELIVERY',
        deliveryId,
        {
          type: 'COGS',
          amount: totalDeliveryCogs,
          description: 'COGS for Delivery ' + delivery.delivery_number,
          date: delivery.delivery_date
        },
        tx
      ));`;
const newDelEvent = `      this.eventEmitter.emit('inventory.valuation', new InventoryValuationEvent(
        companyId,
        deliveryId,
        \`VAL-DEL-\${deliveryId}\`,
        new Date(),
        {
          type: 'COGS',
          totalValue: totalDeliveryCogs,
          description: 'COGS for Delivery ' + delivery.delivery_number
        },
        tx
      ));`;
delCode = delCode.replace(oldDelEvent, newDelEvent);
fs.writeFileSync('src/crm/delivery/delivery.service.ts', delCode, 'utf8');

// Fix POS
let posCode = fs.readFileSync('src/pos/pos.service.ts', 'utf8');
const oldPosEvent = `        await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(
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
        ));`;
const newPosEvent = `        await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(
          companyId,
          salesOrder.id,
          \`VAL-POS-\${salesOrder.id}\`,
          new Date(),
          {
            type: 'COGS',
            totalValue: totalPosCogs,
            description: 'COGS for POS ' + salesOrder.order_number
          },
          tx
        ));`;
posCode = posCode.replace(oldPosEvent, newPosEvent);
fs.writeFileSync('src/pos/pos.service.ts', posCode, 'utf8');

console.log('events patched');
