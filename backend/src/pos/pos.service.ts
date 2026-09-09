import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { consumeFifoLayers } from '../inventory/fifo.engine';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesCompletedEvent } from '../events/sales-completed.event';
import { InventoryValuationEvent } from '../events/accounting.events';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async processCheckout(data: any) {
    const { companyId, userId, warehouseId, customerId, paymentMethod, items, subtotal, tax, total } = data;
    let totalPosCogs = 0;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sales Order (Receipt)
      const soNo = `POS-${Date.now()}`;
      const salesOrder = await tx.salesOrder.create({
        data: {
          company_id: companyId,
          order_number: soNo,
          customer_id: customerId,
          order_date: new Date(),
          status: 'COMPLETED',
          total_amount: total ?? items.reduce((s: number, i: any) => s + i.qty * i.price, 0),
          payment_status: 'PAID',
          payment_method: paymentMethod || 'CASH',
        }
      });

      // 2. Loop Items
      for (const item of items) {
        // Create Sales Order Item
        await tx.salesOrderItem.create({
          data: {
            sales_order_id: salesOrder.id,
            product_id: item.productId,
            qty: item.qty,
            unit_price: item.price,
            subtotal: item.qty * item.price,
          }
        });

        if (warehouseId) {
          // Deduct Stock
          const currentStock = await tx.warehouseStock.findUnique({
            where: {
              company_id_warehouse_id_product_id: {
                company_id: companyId,
                warehouse_id: warehouseId,
                product_id: item.productId,
              }
            }
          });

          if (currentStock) {
            const posStockUpd = await tx.warehouseStock.updateMany({
                where: { id: currentStock.id, available_stock: { gte: item.qty } },
                data: {
                  current_stock: { decrement: item.qty },
                  available_stock: { decrement: item.qty }
                }
              });
              if (posStockUpd.count === 0) {
                 throw new BadRequestException('Concurrency conflict or insufficient stock for POS item ' + item.productId);
              }

            const mov = await tx.stockMovement.create({
              data: {
                company_id: companyId,
                warehouse_id: warehouseId,
                product_id: item.productId,
                transaction_type: 'POS_SALE',
                transaction_id: salesOrder.id,
                movement_type: 'OUT',
                qty_in: 0,
                qty_out: item.qty,
                balance_after: currentStock.current_stock - item.qty,
                unit_cost: 0,
                total_cost: 0,
                created_by: userId || 'SYSTEM',
              }
            });
            
            // STEP 16.5 - True FIFO Consumption
            const { totalCogs } = await consumeFifoLayers(tx, {
              companyId,
              productId: item.productId,
              warehouseId,
              quantity: item.qty,
              stockMovementId: mov.id
            });
            totalPosCogs += totalCogs;

            const actual_unit_cost = item.qty > 0 ? totalCogs / item.qty : 0;
            await tx.stockMovement.update({
              where: { id: mov.id },
              data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
            });
          }
        }
      }

      // 3. Finance Transaction (Add Revenue)
      const cashAccount = await tx.cashAccount.findFirst({
        where: { company_id: companyId }
      });

      if (cashAccount) {
        await tx.financeTransaction.create({
          data: {
            company_id: companyId,
            cash_account_id: cashAccount.id,
            transaction_no: `TRX-${Date.now()}`,
            transaction_type: 'Income',
            transaction_date: new Date(),
            total_amount: total,
            reference_type: 'POS',
            reference_id: salesOrder.id,
            description: `Penjualan POS #${soNo}`,
            status: 'COMPLETED',
            created_by: userId,
          }
        });

        
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          action: 'CREATE',
          entity: 'POS_Transaction',
          entity_id: salesOrder.id,
          after_data: { details: `Kasir memproses transaksi ${soNo} senilai ${total}` }
        }
      });

      // 5. Emit Domain Event for Accounting Integration
      // Using async Emit (waiting for handlers to complete within this transaction boundary)
      await this.eventEmitter.emitAsync(
        'sales.completed',
        new SalesCompletedEvent({
          companyId,
          sourceEntityId: salesOrder.id,
          payload: {
            totalAmount: salesOrder.total_amount,
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
          salesOrder.id,
          `VAL-POS-${salesOrder.id}`,
          new Date(),
          {
            type: 'COGS',
            totalValue: totalPosCogs,
            description: 'COGS for POS ' + salesOrder.order_number
          },
          tx
        ));
      }

      return salesOrder;
    });
  }

  async getHistory(companyId: string) {
    return this.prisma.salesOrder.findMany({
      where: { company_id: companyId },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { order_date: 'desc' }
    });
  }

  async getCurrentShift(companyId: string, userId: string) {
    return this.prisma.posShift.findFirst({
      where: {
        company_id: companyId,
        user_id: userId,
        status: 'OPEN'
      }
    });
  }

  async openShift(data: any) {
    const { companyId, warehouseId, userId, startingCash } = data;
    
    // Check if there is already an open shift
    const existingShift = await this.getCurrentShift(companyId, userId);
    if (existingShift) {
      throw new BadRequestException('You already have an open shift');
    }

    return this.prisma.posShift.create({
      data: {
        company_id: companyId,
        warehouse_id: warehouseId,
        user_id: userId,
        starting_cash: startingCash,
        status: 'OPEN',
      }
    });
  }

  async closeShift(data: any) {
    const { companyId, userId, endingCash } = data;
    
    const existingShift = await this.getCurrentShift(companyId, userId);
    if (!existingShift) {
      throw new BadRequestException('No open shift found to close');
    }

    return this.prisma.posShift.update({
      where: { id: existingShift.id },
      data: {
        end_time: new Date(),
        ending_cash: endingCash,
        status: 'CLOSED'
      }
    });
  }
}

