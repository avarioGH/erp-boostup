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
      if (invoice.status !== 'POSTED' && invoice.status !== 'PARTIAL') {
         throw new BadRequestException('Invoice must be POSTED to receive payment');
      }

      if (data.amount > invoice.remaining_amount) {
         throw new BadRequestException('Payment exceeds remaining amount');
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
      const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paid_amount: newPaid, remaining_amount: newRemaining, status: newStatus }
      });

      if (invoice.sales_order_id && newStatus === 'PAID') {
         await tx.salesOrder.update({
           where: { id: invoice.sales_order_id },
           data: { payment_status: 'PAID' }
         });
      }

      // We assume data.accountId is passed, otherwise we look up default cash account
      let accountId = data.accountId;
      if (!accountId) {
        const cashAcc = await tx.cashAccount.findFirst({ where: { company_id: companyId }});
        if (cashAcc) accountId = cashAcc.id;
        else throw new BadRequestException('No cash account specified or default found');
      }

      // Operational cash flow log
      await tx.financeTransaction.create({
        data: {
          company_id: companyId,
          transaction_no: 'TRX-' + Date.now(),
          transaction_type: invoice.type === 'VENDOR_BILL' ? 'Cash Out' : 'Cash In',
          cash_account_id: accountId,
          reference_type: 'PAYMENT',
          reference_id: payment.id,
          transaction_date: payment.payment_date,
          status: 'COMPLETED',
          description: `Payment for invoice ${invoice.invoice_number}`, created_by: 'SYSTEM'
        }
      });

      // Emitting Accounting Event
      await this.eventEmitter.emitAsync('payment.received', new PaymentProcessedEvent(
        companyId,
        payment.id,
        'EVT-' + Date.now(),
        payment.payment_date,
        {
           type: invoice.type === 'VENDOR_BILL' ? 'PAYABLE' : 'RECEIVABLE',
           amount: payment.amount,
           accountId: accountId
        },
        tx as any
      ));

      return payment;
    });
  }
}
