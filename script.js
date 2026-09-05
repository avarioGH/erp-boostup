const fs = require('fs');
const path = require('path');

const file = 'backend/src/inventory/inventory.service.ts';
let code = fs.readFileSync(file, 'utf8');

const startIndex = code.indexOf('async createTransfer(data: CreateTransferDto) {');

if (startIndex > -1) {
    const keep = code.substring(0, startIndex);
    
    const newMethods = \
  async createTransfer(data: any) {
    return this.prisma.\\(async (tx) => {
      // Create Transaction Header (Draft)
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.sourceWarehouseId,
          target_warehouse_id: data.targetWarehouseId,
          transaction_no: data.transactionNo || \\\TRF-\\\\\\,
          transaction_type: 'TRANSFER',
          status: 'Draft',
          transaction_date: data.transactionDate || new Date(),
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty, // Transfer qty
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });
      }
      return transaction;
    });
  }

  async validateTransfer(companyId: string, id: string, userId: string) {
    return this.prisma.\\(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Transfer not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft transfers can be validated');

      for (const item of transaction.items) {
        // Source Stock Check
        const sourceStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: companyId,
              warehouse_id: transaction.warehouse_id,
              product_id: item.product_id,
            }
          }
        });
        if (!sourceStock || sourceStock.available_stock < item.qty) {
          throw new BadRequestException(\\\Stock tidak mencukupi di gudang asal untuk product \\\\\\);
        }

        // Deduct from Source
        await tx.warehouseStock.update({
          where: { id: sourceStock.id },
          data: {
            current_stock: sourceStock.current_stock - item.qty,
            available_stock: sourceStock.available_stock - item.qty,
          }
        });

        // Add to Target
        let targetStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: companyId,
              warehouse_id: transaction.target_warehouse_id!,
              product_id: item.product_id,
            }
          }
        });
        if (!targetStock) {
          targetStock = await tx.warehouseStock.create({
            data: {
              company_id: companyId,
              warehouse_id: transaction.target_warehouse_id!,
              product_id: item.product_id,
              current_stock: item.qty,
              available_stock: item.qty,
              reserved_stock: 0
            }
          });
        } else {
          await tx.warehouseStock.update({
            where: { id: targetStock.id },
            data: {
              current_stock: targetStock.current_stock + item.qty,
              available_stock: targetStock.available_stock + item.qty,
            }
          });
        }

        // Movements
        await tx.stockMovement.create({
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
        });
      }

      return tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
    });
  }

  async createAdjustment(data: any) {
    return this.prisma.\\(async (tx) => {
      // Create Transaction Header (Draft)
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: data.companyId,
          warehouse_id: data.warehouseId,
          transaction_no: data.transactionNo || \\\ADJ-\\\\\\,
          transaction_type: 'ADJUSTMENT',
          status: 'Draft',
          transaction_date: data.transactionDate || new Date(),
          notes: data.notes,
          created_by: data.userId,
        },
      });

      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: 0, // Computed at validate
            system_qty: item.systemQty,
            counted_qty: item.countedQty,
            difference: item.countedQty - item.systemQty,
            notes: item.notes,
          },
        });
      }
      return transaction;
    });
  }

  async validateAdjustment(companyId: string, id: string, userId: string) {
    return this.prisma.\\(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Adjustment not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft adjustments can be validated');

      for (const item of transaction.items) {
        const diff = item.difference || 0;
        if (diff === 0) continue;

        let stock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: companyId,
              warehouse_id: transaction.warehouse_id,
              product_id: item.product_id,
            }
          }
        });

        if (!stock && diff > 0) {
          stock = await tx.warehouseStock.create({
            data: {
              company_id: companyId,
              warehouse_id: transaction.warehouse_id,
              product_id: item.product_id,
              current_stock: diff,
              available_stock: diff
            }
          });
        } else if (stock) {
          if (stock.available_stock + diff < 0) {
             throw new BadRequestException(\\\Cannot adjust stock below 0 for product \\\\\\);
          }
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              current_stock: stock.current_stock + diff,
              available_stock: stock.available_stock + diff,
            }
          });
        }

        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: transaction.warehouse_id,
            product_id: item.product_id,
            transaction_type: 'ADJUSTMENT',
            transaction_id: transaction.id,
            movement_type: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
            qty_in: diff > 0 ? diff : 0,
            qty_out: diff < 0 ? Math.abs(diff) : 0,
            balance_after: stock ? stock.current_stock + diff : diff,
            created_by: userId,
          }
        });
      }

      return tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
    });
  }

  async createStockOpname(companyId: string, warehouseId: string, userId: string, productIds?: string[]) {
    return this.prisma.\\(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          company_id: companyId,
          warehouse_id: warehouseId,
          transaction_no: \\\OPN-\\\\\\,
          transaction_type: 'OPNAME',
          status: 'Draft',
          transaction_date: new Date(),
          created_by: userId,
        },
      });

      const filter: any = { company_id: companyId, warehouse_id: warehouseId };
      if (productIds && productIds.length > 0) {
         filter.product_id = { in: productIds };
      }

      const stocks = await tx.warehouseStock.findMany({ where: filter });
      
      const itemData = stocks.map(stock => ({
        transaction_id: transaction.id,
        product_id: stock.product_id,
        qty: 0,
        system_qty: stock.current_stock,
        counted_qty: stock.current_stock, // default pre-fill
        difference: 0
      }));

      if (itemData.length > 0) {
         await tx.inventoryTransactionItem.createMany({ data: itemData });
      }

      return transaction;
    });
  }

  async approveStockOpname(companyId: string, id: string, userId: string, counts: { productId: string, countedQty: number }[]) {
     return this.prisma.\\(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!transaction) throw new NotFoundException('Opname not found');
      if (transaction.status !== 'Draft') throw new BadRequestException('Only Draft opname can be approved');

      for (const count of counts) {
         const item = transaction.items.find(i => i.product_id === count.productId);
         if (!item) continue;
         const diff = count.countedQty - (item.system_qty || 0);
         
         await tx.inventoryTransactionItem.update({
            where: { id: item.id },
            data: { counted_qty: count.countedQty, difference: diff }
         });

         if (diff !== 0) {
            const stock = await tx.warehouseStock.findUnique({
               where: { company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id } }
            });
            if (stock) {
               await tx.warehouseStock.update({
                  where: { id: stock.id },
                  data: {
                     current_stock: stock.current_stock + diff,
                     available_stock: stock.available_stock + diff
                  }
               });
               await tx.stockMovement.create({
                  data: {
                     company_id: companyId,
                     warehouse_id: transaction.warehouse_id,
                     product_id: item.product_id,
                     transaction_type: 'OPNAME',
                     transaction_id: transaction.id,
                     movement_type: diff > 0 ? 'STOCK_OPNAME_IN' : 'STOCK_OPNAME_OUT',
                     qty_in: diff > 0 ? diff : 0,
                     qty_out: diff < 0 ? Math.abs(diff) : 0,
                     balance_after: stock.current_stock + diff,
                     created_by: userId
                  }
               });
            }
         }
      }

      return tx.inventoryTransaction.update({
        where: { id },
        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }
      });
    });
  }
}
\;
    fs.writeFileSync(file, keep + newMethods);
} else {
    console.log('startIndex not found');
}
