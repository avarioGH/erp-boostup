const fs = require('fs');
let code = fs.readFileSync('src/inventory/inventory.service.ts', 'utf8');

if (!code.includes('consumeFifoLayers')) {
  code = code.replace(/import { PrismaService } from '..\/prisma\/prisma.service';/, "import { PrismaService } from '../prisma/prisma.service';\nimport { createFifoLayer, consumeFifoLayers, transferFifoLayers } from './fifo.engine';");
}

const oldStr = `        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_OUT',
            qty_in: 0,
            qty_out: item.qty,
            balance_after: sourceStock.current_stock - item.qty,
            created_by: userId,
          }
        });
        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.target_warehouse_id!,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_IN',
            qty_in: item.qty,
            qty_out: 0,
            balance_after: (targetStock ? targetStock.current_stock : 0) + item.qty,
            created_by: userId,
          }
        });`;

const newStr = `        const movOut = await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_OUT',
            qty_in: 0,
            qty_out: item.qty,
            balance_after: sourceStock.current_stock - item.qty,
            unit_cost: 0,
            total_cost: 0,
            created_by: userId,
          }
        });
        const movIn = await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.target_warehouse_id!,
            product_id: item.product_id,
            transaction_type: 'TRANSFER',
            transaction_id: transaction.id,
            movement_type: 'TRANSFER_IN',
            qty_in: item.qty,
            qty_out: 0,
            balance_after: (targetStock ? targetStock.current_stock : 0) + item.qty,
            unit_cost: 0,
            total_cost: 0,
            created_by: userId,
          }
        });

        // STEP 16.5D - TRUE FIFO TRANSFER
        const { totalCogs } = await transferFifoLayers(tx, {
          companyId,
          productId: item.product_id,
          sourceWarehouseId: transaction.warehouse_id,
          destWarehouseId: transaction.target_warehouse_id!,
          quantity: item.qty,
          sourceMovementId: movOut.id,
          destMovementId: movIn.id
        });
        
        const actual_unit_cost = item.qty > 0 ? totalCogs / item.qty : 0;
        await tx.stockMovement.update({
          where: { id: movOut.id },
          data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
        });
        await tx.stockMovement.update({
          where: { id: movIn.id },
          data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
        });`;

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/inventory/inventory.service.ts', code, 'utf8');
console.log('transfer patched');
