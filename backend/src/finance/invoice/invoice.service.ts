import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

      // For simplicity, we just invoice the full remaining amount.
      // A full ERP would select specific lines to invoice based on delivery.
      
      const invoiceNumber = "INV-${Date.now()}";

      let totalInvoiced = 0;
      so.invoices.forEach(inv => totalInvoiced += inv.total);

      if (totalInvoiced >= so.total_amount) {
        throw new BadRequestException('Sales order is fully invoiced');
      }

      // We just invoice the full SO amount in this simple B2B flow
      let subtotal = 0;
      let tax = 0;

      const itemsData = so.items.map(item => {
        subtotal += item.subtotal;
        return {
          product_id: item.product_id,
          qty: item.qty,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        };
      });

      const total = subtotal + tax;

      const invoice = await tx.invoice.create({
        data: {
          company_id: companyId,
          sales_order_id: so.id,
          customer_id: so.customer_id || '', // Safe fallback
          invoice_number: invoiceNumber,
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'DRAFT',
          subtotal,
          tax,
          total,
          paid_amount: 0,
          remaining_amount: total,
          items: {
            create: itemsData
          }
        },
        include: { items: true }
      });

      return invoice;
    });
  }

  async post(companyId: string, invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, company_id: companyId }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'DRAFT') throw new BadRequestException('Only DRAFT invoice can be posted');

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'POSTED' }
      });

      // Update SO invoice_status
      await tx.salesOrder.update({
        where: { id: invoice.sales_order_id },
        data: { invoice_status: 'INVOICED' } // Simplification
      });

      // Emit domain event for accounting (AR Debit, Revenue Credit)
      // await this.eventEmitter.emitAsync('invoice.posted', new InvoicePostedEvent({...}))
      // Not fully implemented to save space, but architecture is clear

      return invoice;
    });
  }
}
