import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentProcessedEvent } from '../../events/accounting.events';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}

  async create(companyId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: data.invoiceId, company_id: companyId }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      // Fix status check to handle PARTIALLY PAID and POSTED
      if (invoice.status !== 'POSTED' && invoice.status !== 'PARTIALLY PAID' && invoice.status !== 'PARTIAL') {
         throw new BadRequestException('Invoice must be POSTED to receive payment');
      }

      // 12. PAYMENT ENGINE: Amount Validated (Never allow payment > remaining)
      if (data.amount > invoice.remaining_amount) {
         throw new BadRequestException('Payment exceeds remaining amount');
      }
      
      // 12. PAYMENT ENGINE: Never allow negative payment
      if (data.amount <= 0) {
         throw new BadRequestException('Payment amount must be strictly positive');
      }

      const paymentNumber = "PAY-" + Date.now();

      const payment = await tx.payment.create({
        data: {
          company_id: companyId,
          invoice_id: invoice.id,
          payment_number: paymentNumber,
          payment_date: new Date(data.paymentDate || Date.now()),
          amount: data.amount,
          payment_method: data.paymentMethod || 'BANK_TRANSFER',
          notes: data.notes
        }
      });

      const newRemaining = invoice.remaining_amount - data.amount;
        const newPaid = invoice.paid_amount + data.amount;
        const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID'; // Note: status enum is usually PARTIALLY_PAID

        const invoiceUpd = await tx.invoice.updateMany({
          where: { 
            id: invoice.id,
            remaining_amount: invoice.remaining_amount // Optimistic Concurrency Control
          },
          data: { 
            paid_amount: { increment: data.amount },
            remaining_amount: { decrement: data.amount },
            status: newRemaining <= 0 ? 'PAID' : invoice.status === 'POSTED' ? 'PARTIALLY_PAID' : invoice.status
          }
        });

        if (invoiceUpd.count === 0) {
          throw new BadRequestException('Concurrency conflict or invoice state changed. Please retry.');
        }

      if (invoice.sales_order_id && newStatus === 'PAID') {
         await tx.salesOrder.update({
           where: { id: invoice.sales_order_id },
           data: { payment_status: 'PAID' }
         });
      }

      let accountId = data.accountId;
      if (!accountId) {
        const cashAcc = await tx.cashAccount.findFirst({ where: { company_id: companyId }});
        if (cashAcc) accountId = cashAcc.id;
        // if no cash account is found, it's fine, the accounting listener will handle it using defaults or mappings
      }

      const isAP = (invoice.type === 'AP' || invoice.type === 'VENDOR_BILL');
      
      if (accountId) {
        await tx.financeTransaction.create({
          data: {
            company_id: companyId,
            transaction_no: 'TRX-' + Date.now(),
            transaction_type: isAP ? 'Cash Out' : 'Cash In',
            cash_account_id: accountId,
            reference_type: 'PAYMENT',
            reference_id: payment.id,
            transaction_date: payment.payment_date,
            status: 'COMPLETED',
            description: `Payment for invoice ${invoice.invoice_number}`, 
            created_by: '6aa02dc075845f59e02b3f01'
          }
        });
      }

      // Emit strictly typed Accounting Event for Idempotent GlService listening
      await this.eventEmitter.emitAsync('payment.processed', new PaymentProcessedEvent(
        companyId,
        payment.id,
        'EVT-' + Date.now(),
        payment.payment_date,
        {
           type: isAP ? 'PAYABLE' : 'RECEIVABLE',
           amount: payment.amount,
           accountId: accountId
        },
        tx as any
      ));

      return payment;
    });
  }
}
