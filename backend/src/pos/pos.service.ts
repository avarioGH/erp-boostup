import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesCompletedEvent } from '../events/sales-completed.event';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async processCheckout(data: any) {
    const { companyId, userId, warehouseId, customerId, paymentMethod, items, subtotal, tax, total } = data;

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
          total_amount: total,
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
            await tx.warehouseStock.update({
              where: { id: currentStock.id },
              data: {
                current_stock: currentStock.current_stock - item.qty,
                available_stock: currentStock.available_stock - item.qty,
              }
            });

            await tx.stockMovement.create({
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
                created_by: userId || 'SYSTEM',
              }
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

        // Update Cash Balance
        await tx.cashAccount.update({
          where: { id: cashAccount.id },
          data: {
            current_balance: {
              increment: total
            }
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
            totalAmount: total,
            paymentMethod: paymentMethod || 'CASH',
            userId
          },
          tx: tx as any
        })
      );

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

