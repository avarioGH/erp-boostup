import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuotationService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const { customerId, quotationDate, expirationDate, items, notes, billingAddress, deliveryAddress, paymentTerms } = data;
    
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.company_id !== companyId) {
      throw new BadRequestException('Invalid customer');
    }

    const quotationNumber = `QTN-${Date.now()}`;
    
    let total = 0;
    const itemsData = items.map((item: any) => {
      const sub = item.qty * item.price;
      const tax = sub * (item.taxRate || 0);
      const discount = item.discount || 0;
      const lineTotal = sub + tax - discount;
      total += lineTotal;
      return {
        product_id: item.productId,
        qty: item.qty,
        unit_price: item.price,
        discount: discount,
        tax: tax,
        subtotal: lineTotal
      };
    });

    return this.prisma.quotation.create({
      data: {
        company_id: companyId,
        customer_id: customerId,
        quotation_number: quotationNumber,
        quotation_date: new Date(quotationDate),
        expiration_date: expirationDate ? new Date(expirationDate) : null,
        status: 'DRAFT',
        total_amount: total,
        notes,
        billing_address: billingAddress,
        delivery_address: deliveryAddress,
        payment_terms: paymentTerms,
        items: {
          create: itemsData
        }
      },
      include: { items: true, customer: true }
    });
  }

  async confirm(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const q = await tx.quotation.findFirst({
        where: { id, company_id: companyId },
        include: { items: true }
      });
      if (!q) throw new NotFoundException('Quotation not found');
      if (q.status === 'CONFIRMED') throw new BadRequestException('Quotation already confirmed');

      const existingSo = await tx.salesOrder.findFirst({
        where: { quotation_id: q.id }
      });
      if (existingSo) throw new BadRequestException('Sales order already generated for this quotation');

      await tx.quotation.update({
        where: { id: q.id },
        data: { status: 'CONFIRMED' }
      });

      const soNo = `SO-${Date.now()}`;
      const so = await tx.salesOrder.create({
        data: {
          company_id: companyId,
          quotation_id: q.id,
          customer_id: q.customer_id,
          order_number: soNo,
          order_date: new Date(),
          status: 'PENDING',
          delivery_status: 'PENDING',
          invoice_status: 'PENDING',
          total_amount: q.total_amount,
          notes: q.notes,
          billing_address: q.billing_address,
          delivery_address: q.delivery_address,
          payment_method: 'TERM', 
          payment_status: 'UNPAID',
          items: {
            create: q.items.map(item => ({
              product_id: item.product_id,
              qty: item.qty,
              unit_price: item.unit_price,
              subtotal: item.subtotal
            }))
          }
        }
      });

      return so;
    });
  }
}
