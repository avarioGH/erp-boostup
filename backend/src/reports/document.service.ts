import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async getInvoicePdfDefinition(companyId: string, invoiceId: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, company_id: companyId },
      include: { customer: true, items: { include: { product: true } } }
    });
    if (!inv) throw new NotFoundException('Invoice not found');

    return {
      documentTitle: 'INVOICE',
      documentNumber: inv.invoice_number,
      date: inv.invoice_date.toISOString().split('T')[0],
      companyName: 'ERP Boostup Company', // Should fetch from company record in full implementation
      columns: [
        { header: 'Product', key: 'product' },
        { header: 'Qty', key: 'qty' },
        { header: 'Unit Price', key: 'price' },
        { header: 'Total', key: 'total' }
      ],
      data: inv.items.map(item => ({
        product: item.product.name,
        qty: item.qty,
        price: item.unit_price,
        total: item.subtotal
      })),
      totals: {
        'Subtotal': inv.subtotal,
        'Tax': inv.tax,
        'Total': inv.total,
        'Paid': inv.paid_amount,
        'Balance Due': inv.remaining_amount
      }
    };
  }
}
