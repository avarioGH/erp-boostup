import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, invoiceId: string, data: any) {
    const { amount, paymentMethod, paymentDate, notes } = data;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, company_id: companyId }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.status === 'DRAFT') throw new BadRequestException('Cannot pay draft invoice');
      if (amount <= 0) throw new BadRequestException('Amount must be positive');
      if (amount > invoice.remaining_amount) throw new BadRequestException('Amount exceeds remaining balance');

      const paymentNumber = "PAY-${Date.now()}";

      const payment = await tx.payment.create({
        data: {
          company_id: companyId,
          invoice_id: invoiceId,
          payment_number: paymentNumber,
          payment_date: new Date(paymentDate || Date.now()),
          amount,
          payment_method: paymentMethod || 'BANK_TRANSFER',
          notes
        }
      });

      const newRemaining = invoice.remaining_amount - amount;
      const newPaid = invoice.paid_amount + amount;
      const newStatus = newRemaining === 0 ? 'PAID' : 'POSTED';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          remaining_amount: newRemaining,
          paid_amount: newPaid,
          status: newStatus
        }
      });

              // Update PO payment status if this is an AP Bill
        if (invoice.type === 'AP' && invoice.purchase_order_id) {
          const poStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';
          await tx.purchaseOrder.update({
            where: { id: invoice.purchase_order_id },
            data: { payment_status: poStatus }
          });
        } else if (invoice.sales_order_id) {
          const soStatus = newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';
          await tx.salesOrder.update({
            where: { id: invoice.sales_order_id },
            data: { payment_status: soStatus }
          });
        }
        
      return payment;
    });
  }
}

