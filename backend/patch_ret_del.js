const fs = require('fs');
let code = fs.readFileSync('src/crm/delivery/delivery.service.ts', 'utf8');

const returnDel = `      return delivery;
    });
  }
}`;
const returnDelNew = `      await this.eventEmitter.emitAsync('delivery.validated', { deliveryId });
      
      if (totalDeliveryCogs > 0) {
        await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(
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
        ));
      }

      return delivery;
    });
  }
}`;
code = code.replace(returnDel, returnDelNew);
fs.writeFileSync('src/crm/delivery/delivery.service.ts', code, 'utf8');
console.log('patched event at return');
