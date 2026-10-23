import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NettingService {
  constructor(private prisma: PrismaService) {}

  async applyNetting(partner_id: string, amount: number, reqUser: any, notes?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const company_id = reqUser.company_id || reqUser.companyId;

    return this.prisma.$transaction(async (tx) => {
      // Find open Accounts Payable (AP) for this partner
      const apInvoices = await tx.invoice.findMany({
        where: {
          company_id,
          OR: [{ customer_id: partner_id }, { supplier_id: partner_id }],
          type: 'AP',
          status: { in: ['POSTED', 'PARTIALLY PAID', 'PARTIALLY_PAID'] },
        },
        orderBy: { invoice_date: 'asc' },
      });

      // Find open Accounts Receivable (AR) invoices
      const arInvoices = await tx.invoice.findMany({
        where: {
          company_id,
          customer_id: partner_id,
          type: 'AR',
          status: { in: ['POSTED', 'PARTIALLY PAID', 'PARTIALLY_PAID'] },
        },
        orderBy: { invoice_date: 'asc' },
      });

      // Also find open Sales Orders that represent AR debt
      const salesOrders = await tx.salesOrder.findMany({
        where: {
          company_id,
          customer_id: partner_id,
          status: { notIn: ['CANCELLED'] },
        },
        include: { allocations: true },
        orderBy: { created_at: 'asc' },
      });

      let outstandingAP = 0;
      apInvoices.forEach((ap) => (outstandingAP += Number(ap.remaining_amount || 0)));

      let outstandingAR = 0;
      arInvoices.forEach((ar) => (outstandingAR += Number(ar.remaining_amount || 0)));

      // Calculate outstanding on Sales Orders
      const openSalesOrders: { so: typeof salesOrders[0]; outstanding: number }[] = [];
      for (const so of salesOrders) {
        const soPaid = so.allocations?.reduce((acc, a) => acc + (a.amount || 0), 0) || 0;
        const linkedInvs = await tx.invoice.findMany({
          where: { sales_order_id: so.id, status: { notIn: ['CANCELLED'] } },
        });
        const invPaid = linkedInvs.reduce((acc, inv) => acc + (inv.paid_amount || 0), 0);
        const totalPaid = soPaid + invPaid;
        const outst = Number(so.total_amount) - totalPaid;
        if (outst > 0) {
          openSalesOrders.push({ so, outstanding: outst });
          // If this SO has no linked posted AR invoice, add to outstandingAR
          if (linkedInvs.length === 0) {
            outstandingAR += outst;
          }
        }
      }

      if (amount > outstandingAP) {
        throw new BadRequestException(
          `Nominal kompensasi (Rp ${amount.toLocaleString('id-ID')}) melebihi total hutang AP (Rp ${outstandingAP.toLocaleString('id-ID')})`,
        );
      }
      if (amount > outstandingAR) {
        throw new BadRequestException(
          `Nominal kompensasi (Rp ${amount.toLocaleString('id-ID')}) melebihi total piutang AR (Rp ${outstandingAR.toLocaleString('id-ID')})`,
        );
      }

      const nettingRecord = await tx.netting.create({
        data: {
          company_id,
          partner_id,
          netting_number: `NET-${Date.now()}`,
          date: new Date(),
          amount: amount,
          notes: notes || 'Kompensasi Hutang/Piutang (Netting)',
        },
      });

      // 1. Apply to AP Invoices
      let toApplyAP = amount;
      for (const ap of apInvoices) {
        if (toApplyAP <= 0) break;
        const alloc = Math.min(Number(ap.remaining_amount), toApplyAP);

        await tx.nettingAllocation.create({
          data: {
            netting_id: nettingRecord.id,
            invoice_id: ap.id,
            type: 'AP',
            amount: alloc,
          },
        });

        const newPaid = Number(ap.paid_amount || 0) + alloc;
        const newRem = Number(ap.remaining_amount || 0) - alloc;
        await tx.invoice.update({
          where: { id: ap.id },
          data: {
            paid_amount: newPaid,
            remaining_amount: newRem,
            status: newRem <= 0.0001 ? 'PAID' : 'PARTIALLY_PAID',
          },
        });
        toApplyAP -= alloc;
      }

      // 2. Apply to AR (Invoices first, then direct Sales Orders)
      let toApplyAR = amount;
      for (const ar of arInvoices) {
        if (toApplyAR <= 0) break;
        const alloc = Math.min(Number(ar.remaining_amount), toApplyAR);

        await tx.nettingAllocation.create({
          data: {
            netting_id: nettingRecord.id,
            invoice_id: ar.id,
            type: 'AR',
            amount: alloc,
          },
        });

        const newPaid = Number(ar.paid_amount || 0) + alloc;
        const newRem = Number(ar.remaining_amount || 0) - alloc;
        await tx.invoice.update({
          where: { id: ar.id },
          data: {
            paid_amount: newPaid,
            remaining_amount: newRem,
            status: newRem <= 0.0001 ? 'PAID' : 'PARTIALLY_PAID',
          },
        });
        toApplyAR -= alloc;
      }

      // If there's still AR amount to compensate from open Sales Orders
      if (toApplyAR > 0 && openSalesOrders.length > 0) {
        // Create an Invoice for the open Sales Order or allocate via Payment
        for (const { so, outstanding } of openSalesOrders) {
          if (toApplyAR <= 0) break;
          const alloc = Math.min(outstanding, toApplyAR);

          // Create an automatic AR Invoice for the SO so that netting allocation links cleanly
          const invNum = `INV-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;
          const newRem = Number(so.total_amount) - alloc;

          const createdArInv = await tx.invoice.create({
            data: {
              company_id,
              sales_order_id: so.id,
              customer_id: partner_id,
              invoice_number: invNum,
              invoice_date: new Date(),
              status: newRem <= 0.0001 ? 'PAID' : 'PARTIALLY_PAID',
              subtotal: Number(so.total_amount),
              tax: 0,
              total: Number(so.total_amount),
              paid_amount: alloc,
              remaining_amount: newRem,
            },
          });

          await tx.nettingAllocation.create({
            data: {
              netting_id: nettingRecord.id,
              invoice_id: createdArInv.id,
              type: 'AR',
              amount: alloc,
            },
          });

          toApplyAR -= alloc;
        }
      }

      return nettingRecord;
    });
  }

  async getPartnerBalance(partner_id: string, reqUser: any) {
    const company_id = reqUser.company_id || reqUser.companyId;
    const apInvoices = await this.prisma.invoice.findMany({ where: { company_id, OR: [{customer_id: partner_id}, {supplier_id: partner_id}], type: 'AP', status: { not: 'CANCELLED' } }});
    const arInvoices = await this.prisma.invoice.findMany({ where: { company_id, customer_id: partner_id, type: 'AR', status: { not: 'CANCELLED' } }});
    
    let outstanding_ap = 0;
    apInvoices.forEach(ap => outstanding_ap += ap.remaining_amount);
    
    let outstanding_ar = 0;
    arInvoices.forEach(ar => outstanding_ar += ar.remaining_amount);

    return {
      outstanding_ap,
      outstanding_ar,
      net_balance: outstanding_ar - outstanding_ap
    };
  }
}
