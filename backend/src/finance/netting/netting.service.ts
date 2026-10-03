import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NettingService {
  constructor(private prisma: PrismaService) {}

  async applyNetting(partner_id: string, amount: number, reqUser: any) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const company_id = reqUser.company_id;

    return this.prisma.$transaction(async (tx) => {
      // Find open Accounts Payable (AP) for this partner
      const apInvoices = await tx.invoice.findMany({
        where: {
          company_id,
          customer_id: partner_id,
          type: 'AP',
          status: { in: ['POSTED', 'PARTIALLY PAID'] }
        },
        orderBy: { invoice_date: 'asc' }
      });

      // Find open Accounts Receivable (AR) for this partner
      const arInvoices = await tx.invoice.findMany({
        where: {
          company_id,
          customer_id: partner_id,
          type: 'AR',
          status: { in: ['POSTED', 'PARTIALLY PAID'] }
        },
        orderBy: { invoice_date: 'asc' }
      });

      // Calculate total outstanding AP and AR
      let outstandingAP = 0;
      const apList: any[] = [];
      for (const ap of apInvoices) {
        const paidAP = await tx.paymentAllocation.aggregate({
          where: { invoice_id: ap.id },
          _sum: { amount: true }
        });
        const due = ap.total - (paidAP._sum.amount || 0);
        if (due > 0) {
          outstandingAP += due;
          apList.push({ ...ap, due });
        }
      }

      let outstandingAR = 0;
      const arList: any[] = [];
      for (const ar of arInvoices) {
        const paidAR = await tx.paymentAllocation.aggregate({
          where: { invoice_id: ar.id },
          _sum: { amount: true }
        });
        const due = ar.total - (paidAR._sum.amount || 0);
        if (due > 0) {
          outstandingAR += due;
          arList.push({ ...ar, due });
        }
      }

      if (amount > outstandingAP) {
        throw new BadRequestException(`Netting amount cannot exceed outstanding AP (${outstandingAP})`);
      }
      if (amount > outstandingAR) {
        throw new BadRequestException(`Netting amount cannot exceed outstanding AR (${outstandingAR})`);
      }

      let remainingNettingAmount = amount;
      
      // We create a "NETTING" payment record representing this offset
      const nettingPayment = await tx.payment.create({
        data: {
          company_id,
          customer_id: partner_id,
          payment_number: `NET-${Date.now()}`,
          payment_date: new Date(),
          amount: amount * 2, // Technically it pays both AP and AR by this amount
          payment_method: 'NETTING',
          notes: 'Kompensasi Hutang/Piutang (Netting)'
        }
      });

      // Apply to AP
      let toApplyAP = amount;
      for (const ap of apList) {
        if (toApplyAP <= 0) break;
        const alloc = Math.min(ap.due, toApplyAP);
        await tx.paymentAllocation.create({
          data: {
            payment_id: nettingPayment.id,
            invoice_id: ap.id,
            amount: alloc
          }
        });
        
        const newDue = ap.due - alloc;
        await tx.invoice.update({
          where: { id: ap.id },
          data: { status: newDue <= 0 ? 'PAID' : 'PARTIALLY PAID' }
        });
        toApplyAP -= alloc;
      }

      // Apply to AR
      let toApplyAR = amount;
      for (const ar of arList) {
        if (toApplyAR <= 0) break;
        const alloc = Math.min(ar.due, toApplyAR);
        await tx.paymentAllocation.create({
          data: {
            payment_id: nettingPayment.id,
            invoice_id: ar.id,
            amount: alloc
          }
        });
        
        const newDue = ar.due - alloc;
        await tx.invoice.update({
          where: { id: ar.id },
          data: { status: newDue <= 0 ? 'PAID' : 'PARTIALLY PAID' }
        });
        toApplyAR -= alloc;
      }

      return nettingPayment;
    });
  }

  async getPartnerBalance(partner_id: string, reqUser: any) {
    const company_id = reqUser.company_id;
    // ... similar logic to compute outstanding AP and AR, return { ap, ar, net }
    const apInvoices = await this.prisma.invoice.findMany({ where: { company_id, customer_id: partner_id, type: 'AP', status: { not: 'CANCELLED' } }});
    const arInvoices = await this.prisma.invoice.findMany({ where: { company_id, customer_id: partner_id, type: 'AR', status: { not: 'CANCELLED' } }});
    
    let apTotal = 0;
    for (const inv of apInvoices) {
      const allocs = await this.prisma.paymentAllocation.aggregate({ where: { invoice_id: inv.id }, _sum: { amount: true }});
      apTotal += inv.total - (allocs._sum.amount || 0);
    }

    let arTotal = 0;
    for (const inv of arInvoices) {
      const allocs = await this.prisma.paymentAllocation.aggregate({ where: { invoice_id: inv.id }, _sum: { amount: true }});
      arTotal += inv.total - (allocs._sum.amount || 0);
    }

    return {
      outstanding_ap: apTotal, // Perusahaan Hutang ke Mitra
      outstanding_ar: arTotal, // Mitra berhutang ke Perusahaan (Piutang)
      net_balance: apTotal - arTotal // Positive means Perusahaan still owes Mitra. Negative means Mitra owes Perusahaan.
    };
  }
}
