import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicePostedEvent } from '../../events/accounting.events';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(companyId: string, data: any) {
    let targetCompanyId = companyId;
    if (!targetCompanyId || !/^[0-9a-fA-F]{24}$/.test(targetCompanyId)) {
      const firstCompany = await this.prisma.company.findFirst();
      if (firstCompany) targetCompanyId = firstCompany.id;
    }

    const {
      customerId,
      invoiceNumber: customInvoiceNumber,
      invoiceDate,
      dueDate,
      items = [],
      tax = 0,
      notes,
    } = data;

    let invoiceNumber = customInvoiceNumber;
    if (!invoiceNumber) {
      invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }
    const existing = await this.prisma.invoice.findFirst({
      where: { company_id: targetCompanyId, invoice_number: invoiceNumber },
    });
    if (existing) {
      invoiceNumber = `${invoiceNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // Default product for invoice item if product_id not provided
    let defaultProduct = await this.prisma.product.findFirst({
      where: { company_id: targetCompanyId },
    });
    if (!defaultProduct) defaultProduct = await this.prisma.product.findFirst();

    let subtotal = 0;
    const itemsData = items.map((item: any) => {
      const qty = Number(item.qty || item.quantity || 1);
      const unit_price = Number(item.unit_price || item.unitPrice || 0);
      const lineSubtotal = Number(item.subtotal || qty * unit_price);
      subtotal += lineSubtotal;

      return {
        product_id: item.product_id || item.productId || defaultProduct?.id,
        description: item.description || 'Kayu Sawn / Olahan',
        qty,
        unit_price,
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
        subtotal: lineSubtotal,
      };
    });

    const taxAmount = Number(tax || 0);
    const total = subtotal + taxAmount;

    return this.prisma.invoice.create({
      data: {
        company_id: targetCompanyId,
        customer_id: customerId || undefined,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate ? new Date(invoiceDate) : new Date(),
        due_date: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal,
        tax: taxAmount,
        total,
        paid_amount: 0,
        remaining_amount: total,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  async createFromSO(companyId: string, salesOrderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findFirst({
        where: { id: salesOrderId, company_id: companyId },
        include: { items: true, customer: true, invoices: true },
      });
      if (!so) throw new NotFoundException('Sales order not found');

      const invoiceNumber = 'INV-' + Date.now();
      let totalInvoiced = 0;
      so.invoices.forEach((inv) => (totalInvoiced += inv.total));
      if (totalInvoiced >= so.total_amount)
        throw new BadRequestException('Sales order is fully invoiced');

      let subtotal = 0;
      const itemsData = so.items.map((item) => {
        subtotal += item.subtotal;
        return {
          product_id: item.product_id,
          qty: Number(item.qty),
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        };
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
          items: { create: itemsData },
        },
        include: { items: true },
      });
    });
  }

  async post(companyId: string, invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, company_id: companyId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status !== 'DRAFT')
        throw new BadRequestException('Only DRAFT invoice can be posted');

      const updatedRes = await tx.invoice.updateMany({
        where: { id: invoiceId, status: 'DRAFT' },
        data: { status: 'POSTED' },
      });
      if (updatedRes.count === 0) {
        throw new BadRequestException(
          'Concurrency conflict or Invoice is no longer DRAFT',
        );
      }
      const updated = await tx.invoice.findUnique({ where: { id: invoiceId } });

      if (invoice.sales_order_id) {
        await tx.salesOrder.update({
          where: { id: invoice.sales_order_id },
          data: { invoice_status: 'INVOICED' },
        });
      }

      await this.eventEmitter.emitAsync(
        'invoice.posted',
        new InvoicePostedEvent(
          companyId,
          invoice.id,
          'EVT-' + Date.now(),
          new Date(),
          {
            type: (invoice.type || 'SALES_INVOICE') as any,
            totalAmount: invoice.total,
          },
          tx as any,
        ),
      );

      return updated;
    });
  }
}
