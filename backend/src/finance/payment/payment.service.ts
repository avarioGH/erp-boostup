import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentProcessedEvent } from '../../events/accounting.events';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(companyId: string, data: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      let paymentNumber = data.paymentNumber;
      if (!paymentNumber) {
        paymentNumber = 'PAY-' + Date.now();
      }

      if (data.amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }

      // If they provide allocations explicitly
      const allocations = data.allocations || [];
      if (!allocations.length && data.salesOrderId) {
        allocations.push({
          salesOrderId: data.salesOrderId,
          amount: data.amount,
        });
      } else if (!allocations.length && data.invoiceId) {
        allocations.push({ invoiceId: data.invoiceId, amount: data.amount });
      }

      if (allocations.length === 0 && !data.allowUnallocated) {
        throw new BadRequestException(
          'Payment must have at least one allocation',
        );
      }

      let totalAllocated = 0;
      for (const alloc of allocations) {
        if (alloc.amount <= 0)
          throw new BadRequestException(
            'Allocation amount must be greater than 0',
          );
        totalAllocated += alloc.amount;
      }

      // Ensure we don't have floating point inaccuracies causing false alarms
      if (
        Math.abs(totalAllocated - data.amount) > 0.01 &&
        !data.allowUnallocated
      ) {
        throw new BadRequestException(
          `Total allocated (${totalAllocated}) does not match payment amount (${data.amount})`,
        );
      }

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          company_id: companyId,
          customer_id: data.customerId || undefined,
          invoice_id: data.invoiceId || undefined,
          payment_number: paymentNumber,
          payment_date: new Date(data.paymentDate || Date.now()),
          amount: data.amount,
          payment_method: data.paymentMethod || 'BANK_TRANSFER',
          reference: data.reference,
          notes: data.notes,
          created_by: userId,
        },
      });

      let isAP = false;

      // Process Allocations
      for (const alloc of allocations) {
        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            sales_order_id: alloc.salesOrderId || undefined,
            invoice_id: alloc.invoiceId || undefined,
            amount: alloc.amount,
          },
        });

        if (alloc.salesOrderId) {
          const so = await tx.salesOrder.findFirst({
            where: { id: alloc.salesOrderId },
          });
          if (!so)
            throw new NotFoundException(
              `Sales Order ${alloc.salesOrderId} not found`,
            );

          // Re-calculate SO paid amount using all its allocations
          const allAllocations = await tx.paymentAllocation.findMany({
            where: { sales_order_id: alloc.salesOrderId },
          });
          const totalPaid = allAllocations.reduce(
            (sum, a) => sum + a.amount,
            0,
          );
          const outstanding = so.total_amount - totalPaid;

          if (outstanding < -0.01) {
            throw new BadRequestException(
              `Payment allocation exceeds outstanding for SO ${so.order_number}`,
            );
          }

          let newStatus = 'UNPAID';
          if (totalPaid >= so.total_amount - 0.01) newStatus = 'PAID';
          else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID';

          await tx.salesOrder.update({
            where: { id: so.id },
            data: { payment_status: newStatus },
          });
        }

        if (alloc.invoiceId) {
          const inv = await tx.invoice.findFirst({
            where: { id: alloc.invoiceId },
          });
          if (!inv)
            throw new NotFoundException(`Invoice ${alloc.invoiceId} not found`);
          if (inv.type === 'AP' || inv.type === 'VENDOR_BILL') isAP = true;

          const newRemaining = inv.remaining_amount - alloc.amount;
          const newPaid = inv.paid_amount + alloc.amount;
          if (newRemaining < -0.01) {
            throw new BadRequestException(
              `Payment allocation exceeds remaining for Invoice ${inv.invoice_number}`,
            );
          }

          let newStatus = 'PARTIALLY_PAID';
          if (newRemaining <= 0.01) newStatus = 'PAID';

          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              remaining_amount: newRemaining,
              paid_amount: newPaid,
              status: newStatus,
            },
          });
          
          if (inv.purchase_order_id) {
            const allInvs = await tx.invoice.findMany({
              where: { purchase_order_id: inv.purchase_order_id, type: { in: ['AP', 'VENDOR_BILL'] } },
            });
            // We need to account for the current update since the transaction hasn't committed? 
            // Wait, Prisma tx will see the updated row if we await. We did await above.
            const allPaid = allInvs.every((i: any) => i.status === 'PAID');
            const anyPaid = allInvs.some((i: any) => i.paid_amount > 0);
            
            await tx.purchaseOrder.update({
              where: { id: inv.purchase_order_id },
              data: {
                payment_status: allPaid ? 'PAID' : anyPaid ? 'PARTIAL' : 'UNPAID',
              },
            });
          }
        }
      }

      // Record to Ledger (Finance Transaction)
      let accountId = data.cashAccountId;
      if (!accountId) {
        const cashAcc = await tx.cashAccount.findFirst({
          where: { company_id: companyId },
        });
        if (cashAcc) accountId = cashAcc.id;
      }

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
            description: `Pembayaran ${paymentNumber}`,
            created_by: userId || '000000000000000000000000',
          },
        });

        // Emit strictly typed Accounting Event for Idempotent GlService listening
        await this.eventEmitter.emitAsync(
          'payment.processed',
          new PaymentProcessedEvent(
            companyId,
            payment.id,
            'EVT-' + Date.now(),
            payment.payment_date,
            {
              type: isAP ? 'PAYABLE' : 'RECEIVABLE',
              amount: payment.amount,
              accountId: accountId,
            },
            tx as any,
          ),
        );
      }

      return payment;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.payment.findMany({
      where: { company_id: companyId },
      include: { allocations: true, customer: true },
      orderBy: { payment_date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    return this.prisma.payment.findFirst({
      where: { id, company_id: companyId },
      include: {
        allocations: {
          include: { sales_order: true, invoice: true },
        },
        customer: true,
      },
    });
  }
}
