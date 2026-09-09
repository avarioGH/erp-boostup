const fs = require('fs');
let code = fs.readFileSync('src/crm/delivery/delivery.service.ts', 'utf8');

if (!code.includes('consumeFifoLayers')) {
  code = code.replace(/import { PrismaService } from '..\/..\/prisma\/prisma.service';/, "import { PrismaService } from '../../prisma/prisma.service';\nimport { consumeFifoLayers } from '../../inventory/fifo.engine';");
}

const oldDeduct = `        if (stock) {
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              current_stock: stock.current_stock - item.delivered_qty,
              available_stock: stock.available_stock - item.delivered_qty
            }
          });

          await tx.stockMovement.create({
            data: {
              company_id: companyId,
              warehouse_id: warehouse.id,
              product_id: item.product_id,
              transaction_type: 'DELIVERY',
              transaction_id: delivery.id,
              movement_type: 'OUT',
              qty_in: 0,
              qty_out: item.delivered_qty,
              balance_after: stock.current_stock - item.delivered_qty,
              created_by: '000000000000000000000999',
            }
          });
        }`;

const newDeduct = `        if (stock) {
          const updateRes = await tx.warehouseStock.updateMany({
            where: { id: stock.id, available_stock: { gte: item.delivered_qty } },
            data: {
              current_stock: { decrement: item.delivered_qty },
              available_stock: { decrement: item.delivered_qty }
            }
          });
          if (updateRes.count === 0) {
            throw new BadRequestException('Concurrency conflict or insufficient stock for product ' + item.product_id);
          }

          const mov = await tx.stockMovement.create({
            data: {
              company_id: companyId,
              warehouse_id: warehouse.id,
              product_id: item.product_id,
              transaction_type: 'DELIVERY',
              transaction_id: delivery.id,
              movement_type: 'OUT',
              qty_in: 0,
              qty_out: item.delivered_qty,
              balance_after: stock.current_stock - item.delivered_qty,
              unit_cost: 0,
              total_cost: 0,
              created_by: '000000000000000000000999',
            }
          });

          // STEP 16.5D - TRUE FIFO CONSUMPTION
          const { totalCogs } = await consumeFifoLayers(tx, {
            companyId: companyId,
            productId: item.product_id,
            warehouseId: warehouse.id,
            quantity: item.delivered_qty,
            stockMovementId: mov.id
          });
          
          await tx.stockMovement.update({
            where: { id: mov.id },
            data: { unit_cost: totalCogs / item.delivered_qty, total_cost: totalCogs }
          });
          
          totalDeliveryCogs += totalCogs;
        }`;

code = code.replace(oldDeduct, newDeduct);

// insert totalDeliveryCogs init
code = code.replace(/let anyDelivered = false;/, "let anyDelivered = false;\n      let totalDeliveryCogs = 0;");

// emit the accounting event
const oldEmit = `      this.eventEmitter.emit('delivery.validated', { deliveryId });`;
const newEmit = `      this.eventEmitter.emit('delivery.validated', { deliveryId });
      
      this.eventEmitter.emit('inventory.valuation', new InventoryValuationEvent(
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
      
code = code.replace(oldEmit, newEmit);

fs.writeFileSync('src/crm/delivery/delivery.service.ts', code, 'utf8');
console.log('delivery patched');
