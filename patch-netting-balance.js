const fs = require('fs');
let c = fs.readFileSync('backend/src/finance/netting/netting.service.ts', 'utf8');

const balanceMethod = `
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
`;

c = c.replace(/}\r?\n?$/, balanceMethod);
fs.writeFileSync('backend/src/finance/netting/netting.service.ts', c);
