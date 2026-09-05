import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicePostedEvent } from '../../events/accounting.events';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async createFromSO(companyId: string, salesOrderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findFirst({
        where: { id: salesOrderId, company_id: companyId },
        include: { items: true, customer: true, invoices: true }
      });
      if (!so) throw new NotFoundException('Sales order not found');
      
      const invoiceNumber = "INV-" + Date.now();
      let totalInvoiced = 0;
      so.invoices.forEach(inv => totalInvoiced += inv.total);
      if (totalInvoiced >= so.total_amount) throw new BadRequestException('Sales order is fully invoiced');

      let subtotal = 0;
      const itemsData = so.items.map(item => {
        subtotal += item.subtotal;
        return { product_id: item.product_id, qty: item.qty, unit_price: item.unit_price, subtotal: item.subtotal };
      });
      const total = subtotal;

      return tx.invoice.create({
        data: {
          company_id: companyId,
          sales_order_id: so.id,
          customer_id: so.customer_id || '',
          invoice_number: invoiceNumber,
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'DRAFT',
          subtotal,
          tax: 0,
          total,
          paid_amount: 0,
          remaining_amount: total,
          items: { create: itemsData }
        },
        include: { items: true }
      });
    });
  }

  async post(companyId: string, invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, company_id: companyId }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'DRAFT') throw new BadRequestException('Only DRAFT invoice can be posted');

      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'POSTED' }
      });

      if (invoice.sales_order_id) {
        await tx.salesOrder.update({
          where: { id: invoice.sales_order_id },
          data: { invoice_status: 'INVOICED' } 
        });
      }

      await this.eventEmitter.emitAsync('invoice.posted', new InvoicePostedEvent(
        companyId, 
        invoice.id, 
        'EVT-' + Date.now(), 
        new Date(), 
        { 
          type: invoice.type || 'SALES_INVOICE', 
          totalAmount: invoice.total 
        }, 
        tx as any
      ));

      return updated;
    });
  }
}
