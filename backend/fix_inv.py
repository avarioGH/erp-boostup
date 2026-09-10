import re

with open('src/inventory/inventory.service.ts', 'r') as f:
    c = f.read()

# Refactor createInbound
old_inbound = """      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });

        await tx.stockMovement.create({
          data: {
            company_id: data.companyId,
            warehouse_id: data.warehouseId,
            product_id: item.productId,
            transaction_type: 'INBOUND',
            transaction_id: transaction.id,
            movement_type: 'STOCK_IN',
            qty_in: item.qty,
            qty_out: 0,
            balance_after: 0, // Set later or not strictly tracked if using sum
            unit_cost: item.unitCost,
            total_cost: item.qty * item.unitCost,
            created_by: data.userId,
            remarks: item.notes,
          },
        });

        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
            },
          },
        });

        if (currentStock) {
          await tx.warehouseStock.update({
            where: { id: currentStock.id },
            data: {
              current_stock: { increment: item.qty },
              available_stock: { increment: item.qty },
            },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
              current_stock: item.qty,
              available_stock: item.qty,
            },
          });
        }
      }"""

new_inbound = """      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });

        await this.receiveStock(tx as any, {
          companyId: data.companyId,
          warehouseId: data.warehouseId,
          productId: item.productId,
          quantity: item.qty,
          unitCost: item.unitCost || 0,
          referenceType: 'INBOUND',
          referenceId: transaction.id,
          description: item.notes || 'Inbound Stock',
          userId: data.userId
        });
      }"""
c = c.replace(old_inbound, new_inbound)


# Refactor createOutbound
old_outbound = """      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });

        const currentStock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: data.companyId,
              warehouse_id: data.warehouseId,
              product_id: item.productId,
            },
          },
        });

        if (!currentStock || currentStock.available_stock < item.qty) {
          throw new BadRequestException('Stock tidak mencukupi untuk product ' + item.productId);
        }

        await tx.stockMovement.create({
          data: {
            company_id: data.companyId,
            warehouse_id: data.warehouseId,
            product_id: item.productId,
            transaction_type: 'OUTBOUND',
            transaction_id: transaction.id,
            movement_type: 'STOCK_OUT',
            qty_in: 0,
            qty_out: item.qty,
            balance_after: currentStock.current_stock - item.qty,
            unit_cost: item.unitCost,
            total_cost: item.qty * item.unitCost,
            created_by: data.userId,
            remarks: item.notes,
          },
        });

        const updateResult = await tx.warehouseStock.updateMany({
          where: {
            id: currentStock.id,
            available_stock: { gte: item.qty },
          },
          data: {
            current_stock: { decrement: item.qty },
            available_stock: { decrement: item.qty },
          },
        });
        
        if (updateResult.count === 0) {
           throw new BadRequestException('Concurrency conflict for product ' + item.productId);
        }
      }"""

new_outbound = """      for (const item of data.items) {
        await tx.inventoryTransactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.productId,
            qty: item.qty,
            unit_cost: item.unitCost || 0,
            subtotal: (item.qty * (item.unitCost || 0)),
            notes: item.notes,
          },
        });

        try {
          await this.issueStock(tx as any, {
            companyId: data.companyId,
            warehouseId: data.warehouseId,
            productId: item.productId,
            quantity: item.qty,
            referenceType: 'OUTBOUND',
            referenceId: transaction.id,
            description: item.notes || 'Outbound Stock',
            userId: data.userId
          });
        } catch(e: any) {
          if (e.message.includes('Insufficient available stock')) throw new BadRequestException('Stock tidak mencukupi untuk product ' + item.productId);
          throw e;
        }
      }"""
c = c.replace(old_outbound, new_outbound)


# validateTransfer refactor
old_validate_transfer = """        for (const item of transaction.items) {
          const sourceStock = await tx.warehouseStock.findUnique({
            where: {
              company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id }
            }
          });
          if (!sourceStock || sourceStock.available_stock < item.qty) {
            throw new BadRequestException('Stock tidak mencukupi di gudang asal untuk product ' + item.product_id);
          }

          const updateRes = await tx.warehouseStock.updateMany({
              where: { id: sourceStock.id, available_stock: { gte: item.qty } },
              data: {
                current_stock: { decrement: item.qty },
                available_stock: { decrement: item.qty }
              }
            });
            if (updateRes.count === 0) {
              throw new BadRequestException('Concurrency conflict or insufficient stock at source for product ' + item.product_id);
            }

          let targetStock = await tx.warehouseStock.findUnique({
            where: {
              company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.target_warehouse_id!, product_id: item.product_id }
            }
          });

          if (!targetStock) {
            targetStock = await tx.warehouseStock.create({
              data: {
                company_id: companyId, warehouse_id: transaction.target_warehouse_id!, product_id: item.product_id,
                current_stock: 0, available_stock: 0
              }
            });
          }

          await tx.warehouseStock.update({
            where: { id: targetStock.id },
            data: {
              current_stock: { increment: item.qty },
              available_stock: { increment: item.qty }
            }
          });

          const movOut = await tx.stockMovement.create({
            data: {
              company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id,
              transaction_type: 'TRANSFER', transaction_id: transaction.id, movement_type: 'TRANSFER_OUT',
              qty_in: 0, qty_out: item.qty, balance_after: sourceStock.current_stock - item.qty,
              created_by: userId, remarks: 'Transfer Out to ' + transaction.target_warehouse_id
            }
          });

          const movIn = await tx.stockMovement.create({
            data: {
              company_id: companyId, warehouse_id: transaction.target_warehouse_id!, product_id: item.product_id,
              transaction_type: 'TRANSFER', transaction_id: transaction.id, movement_type: 'TRANSFER_IN',
              qty_in: item.qty, qty_out: 0, balance_after: targetStock.current_stock + item.qty,
              created_by: userId, remarks: 'Transfer In from ' + transaction.warehouse_id
            }
          });

          await transferFifoLayers(tx as any, {
            companyId,
            productId: item.product_id,
            sourceWarehouseId: transaction.warehouse_id,
            destWarehouseId: transaction.target_warehouse_id!,
            quantity: item.qty,
            sourceMovementId: movOut.id,
            destMovementId: movIn.id
          });
        }"""

new_validate_transfer = """        for (const item of transaction.items) {
          try {
            await this.transferStock(tx as any, {
              companyId,
              sourceWarehouseId: transaction.warehouse_id,
              targetWarehouseId: transaction.target_warehouse_id!,
              productId: item.product_id,
              quantity: item.qty,
              referenceType: 'TRANSFER',
              referenceId: transaction.id,
              description: 'Stock Transfer',
              userId
            });
          } catch(e: any) {
             throw new BadRequestException('Stock tidak mencukupi di gudang asal untuk product ' + item.product_id);
          }
        }"""
c = c.replace(old_validate_transfer, new_validate_transfer)


# createAdjustment
old_create_adjustment = """        for (const item of data.items) {
          const diff = item.qty; // For adjustment, qty is the delta (+/-)
          if (diff === 0) continue;

          let stock = await tx.warehouseStock.findUnique({
            where: { company_id_warehouse_id_product_id: { company_id: data.companyId, warehouse_id: data.warehouseId, product_id: item.productId } }
          });

          if (!stock && diff > 0) {
            stock = await tx.warehouseStock.create({
              data: { company_id: data.companyId, warehouse_id: data.warehouseId, product_id: item.productId, current_stock: 0, available_stock: 0 }
            });
          }

          if (stock) {
            const adjustRes = await tx.warehouseStock.updateMany({
              where: { id: stock.id, available_stock: { gte: diff < 0 ? Math.abs(diff) : 0 } },
              data: {
                current_stock: { increment: diff },
                available_stock: { increment: diff }
              }
            });
            if (adjustRes.count === 0) {
              throw new BadRequestException('Concurrency conflict or insufficient stock for adjustment on ' + item.productId);
            }

            await tx.stockMovement.create({
              data: {
                company_id: data.companyId, warehouse_id: data.warehouseId, product_id: item.productId,
                transaction_type: 'ADJUSTMENT', transaction_id: transaction.id,
                movement_type: diff > 0 ? 'ADJUST_IN' : 'ADJUST_OUT',
                qty_in: diff > 0 ? diff : 0, qty_out: diff < 0 ? Math.abs(diff) : 0,
                balance_after: stock.current_stock + diff,
                created_by: data.userId, remarks: item.notes
              }
            });

            // Re-evaluate cost
            // simplified adjustment logic:
            if (diff < 0) {
              // Consume FIFO layer
              await consumeFifoLayers(tx as any, {
                companyId: data.companyId,
                productId: item.productId,
                warehouseId: data.warehouseId,
                quantity: Math.abs(diff),
                stockMovementId: transaction.id // Not perfect, should be mov id
              });
            } else {
              // Create new layer at average or standard cost? 0 for now.
              await createFifoLayer(tx as any, {
                companyId: data.companyId,
                productId: item.productId,
                warehouseId: data.warehouseId,
                quantity: diff,
                unitCost: item.unitCost || 0,
                stockMovementId: transaction.id
              });
            }
          }
        }"""

new_create_adjustment = """        for (const item of data.items) {
          await this.adjustStock(tx as any, {
            companyId: data.companyId,
            warehouseId: data.warehouseId,
            productId: item.productId,
            difference: item.qty,
            referenceType: 'ADJUSTMENT',
            referenceId: transaction.id,
            description: item.notes,
            userId: data.userId
          });
        }"""
c = c.replace(old_create_adjustment, new_create_adjustment)

# approveStockOpname
old_stock_opname = """         if (diff !== 0) {
            const stock = await tx.warehouseStock.findUnique({
               where: { company_id_warehouse_id_product_id: { company_id: companyId, warehouse_id: transaction.warehouse_id, product_id: item.product_id } }
            });
            if (stock) {
               const adjustRes = await tx.warehouseStock.updateMany({
              where: { id: stock.id, available_stock: { gte: diff < 0 ? Math.abs(diff) : 0 } },
              data: {
                current_stock: { increment: diff },
                available_stock: { increment: diff }
              }
            });
            if (adjustRes.count === 0) {
              throw new BadRequestException('Concurrency conflict or insufficient stock for adjustment on ' + item.product_id);
            }
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
         }"""

new_stock_opname = """         if (diff !== 0) {
           await this.adjustStock(tx as any, {
              companyId,
              warehouseId: transaction.warehouse_id,
              productId: item.product_id,
              difference: diff,
              referenceType: 'OPNAME',
              referenceId: transaction.id,
              description: 'Stock Opname',
              userId
           });
         }"""
c = c.replace(old_stock_opname, new_stock_opname)

with open('src/inventory/inventory.service.ts', 'w') as f:
    f.write(c)

