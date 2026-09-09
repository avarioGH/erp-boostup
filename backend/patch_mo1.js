const fs = require('fs');
let code = fs.readFileSync('src/manufacturing/mo/mo.service.ts', 'utf8');

if (!code.includes('consumeFifoLayers')) {
  code = code.replace(/import \{ PrismaService \} from '\.\.\/\.\.\/prisma\/prisma\.service';/, "import { PrismaService } from '../../prisma/prisma.service';\nimport { createFifoLayer, consumeFifoLayers } from '../../inventory/fifo.engine';");
}

const consumeOld = \        // 14.4 Costing - Fetch Actual Material Cost
        const unit_cost = stock.product.purchase_price || 0;
        const total_cost = unit_cost * reqItem.quantity;\;

// In consumeMaterials, we need to create the movement first, then consume layers, OR consume layers first?
// fifo.engine needs \stockMovementId\!
// But wait, the total_cost and unit_cost must be placed in the StockMovement!
// So we can:
// 1. Create stock movement with 0 cost.
// 2. Consume FIFO layers.
// 3. Update stock movement with actual cost.
// Or we can modify consumeFifoLayers to NOT require stockMovementId upfront? No, it needs it.

const consumeNew = \        // STEP 16.5 - True FIFO Costing (Deferred to after movement creation)\;

code = code.replace(consumeOld, consumeNew);

const movOld = \        const mov = await tx.stockMovement.create({
          data: {
            company_id,
            warehouse_id: mo.warehouse_id,
            product_id: moItem.product_id,
            transaction_type: 'MANUFACTURING',
            transaction_id: mo.id,
            movement_type: 'MANUFACTURING_CONSUMPTION',
            qty_in: 0,
            qty_out: reqItem.quantity,
            balance_after: stock.current_stock - reqItem.quantity,
            unit_cost: unit_cost,
            total_cost: total_cost,\;

const movNew = \        const mov = await tx.stockMovement.create({
          data: {
            company_id,
            warehouse_id: mo.warehouse_id,
            product_id: moItem.product_id,
            transaction_type: 'MANUFACTURING',
            transaction_id: mo.id,
            movement_type: 'MANUFACTURING_CONSUMPTION',
            qty_in: 0,
            qty_out: reqItem.quantity,
            balance_after: stock.current_stock - reqItem.quantity,
            unit_cost: 0,
            total_cost: 0,\;

code = code.replace(movOld, movNew);

const appendAfterMov = \          },
        });\;

const appendNew = \          },
        });

        // STEP 16.5 - True FIFO Consumption
        const { totalCogs, consumed } = await consumeFifoLayers(tx, {
          companyId: company_id,
          productId: moItem.product_id,
          warehouseId: mo.warehouse_id,
          quantity: reqItem.quantity,
          stockMovementId: mov.id
        });

        const actual_unit_cost = reqItem.quantity > 0 ? totalCogs / reqItem.quantity : 0;
        await tx.stockMovement.update({
          where: { id: mov.id },
          data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
        });\;

// Problem: ppendAfterMov matches multiple times. Let's use string replace on a specific block.
