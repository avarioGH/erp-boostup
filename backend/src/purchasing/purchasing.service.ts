import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  async createRFQ(companyId: string, data: any) {
    const { supplierId, orderDate, expectedReceipt, notes, paymentTerms, items, warehouseId } = data;

    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || supplier.company_id !== companyId) throw new BadRequestException('Invalid supplier');

    const orderNumber = `RFQ-${Date.now()}`;

    let total = 0;
    const itemData = items.map((item: any) => {
      const subtotal = item.qty * item.price;
      const tax = subtotal * (item.taxRate || 0);
      const discount = item.discount || 0;
      const finalSub = subtotal + tax - discount;
      total += finalSub;
      return {
        product_id: item.productId,
        qty: item.qty,
        unit_price: item.price,
        tax,
        discount,
        subtotal: finalSub
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        company_id: companyId,
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        order_number: orderNumber,
        order_date: new Date(orderDate),
        expected_receipt: expectedReceipt ? new Date(expectedReceipt) : null,
        status: 'DRAFT',
        receipt_status: 'PENDING',
        bill_status: 'PENDING',
        payment_status: 'UNPAID',
        notes,
        payment_terms: paymentTerms,
        total_amount: total,
        items: {
          create: itemData
        }
      },
      include: { items: true, supplier: true }
    });
  }

  async confirmRFQ(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id, company_id: companyId } });
      if (!po) throw new NotFoundException('Order not found');
      if (po.status !== 'DRAFT') throw new BadRequestException('Order is already confirmed');
      
      const newOrderNumber = po.order_number.replace('RFQ-', 'PO-');

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: 'CONFIRMED',
          order_number: newOrderNumber
        },
        include: { items: true, supplier: true }
      });
    });
  }

  async findOrders(companyId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { company_id: companyId },
        include: { supplier: true },
        skip, take: limit,
        orderBy: { created_at: 'desc' }
      }),
      this.prisma.purchaseOrder.count({ where: { company_id: companyId } })
    ]);
    return { data, total, page, limit };
  }

  async findOrder(companyId: string, id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id, company_id: companyId },
      include: { items: { include: { product: true } }, supplier: true, receipts: true, invoices: true }
    });
  }

  async receiveGoods(companyId: string, purchaseOrderId: string, receiptData: any) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId, company_id: companyId },
        include: { items: true }
      });
      if (!po) throw new NotFoundException('PO not found');
      if (po.status !== 'CONFIRMED') throw new BadRequestException('PO is not confirmed');

      // Create Goods Receipt
      const receiptNumber = `GRN-${Date.now()}`;
      const grn = await tx.goodsReceipt.create({
        data: {
          company_id: companyId,
          purchase_order_id: po.id,
          supplier_id: po.supplier_id,
          warehouse_id: receiptData.warehouseId || po.warehouse_id,
          receipt_number: receiptNumber,
          receipt_date: new Date(),
          status: 'VALIDATED',
          items: {
            create: receiptData.items.map((item: any) => ({
              product_id: item.productId,
              qty: item.qty
            }))
          }
        },
        include: { items: true }
      });

      // Process items: Update PO received quantities and inventory
      let allFullyReceived = true;
      for (const rItem of receiptData.items) {
        const poItem = po.items.find(i => i.product_id === rItem.productId);
        if (!poItem) throw new BadRequestException('Product ' + rItem.productId + ' not in PO');
        
        const newReceivedQty = poItem.received_qty + rItem.qty;
        if (newReceivedQty > poItem.qty) throw new BadRequestException('Cannot receive more than ordered for product ' + rItem.productId);
        
        if (newReceivedQty < poItem.qty) allFullyReceived = false;

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { received_qty: newReceivedQty }
        });

        // Mutate WarehouseStock
        let stock = await tx.warehouseStock.findFirst({
          where: { company_id: companyId, warehouse_id: grn.warehouse_id, product_id: rItem.productId }
        });
        if (!stock) {
          stock = await tx.warehouseStock.create({
            data: { company_id: companyId, warehouse_id: grn.warehouse_id, product_id: rItem.productId, current_stock: 0, available_stock: 0 }
          });
        }

        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: {
            current_stock: stock.current_stock + rItem.qty,
            available_stock: stock.available_stock + rItem.qty
          }
        });

        // Add Stock Movement
        await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: grn.warehouse_id,
            product_id: rItem.productId,
            transaction_type: 'IN',
            transaction_id: grn.id,
            movement_type: 'TRANSFER_IN',
            qty_in: rItem.qty,
            qty_out: 0,
            balance_after: stock.current_stock + rItem.qty,
            unit_cost: poItem.unit_price,
            total_cost: poItem.unit_price * rItem.qty,
            created_by: 'SYSTEM'
          }
        });
      }

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { receipt_status: allFullyReceived ? 'RECEIVED' : 'PARTIAL' }
      });

      return grn;
    });
  }
}
