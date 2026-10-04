const fs = require('fs');
let c = fs.readFileSync('backend/src/crm/crm.service.ts', 'utf8');

c = c.replace(
  "let totalSales = 0;\n    let outstandingInvoices = 0;\n\n    // Old invoice logic\n    invoices.forEach((inv) => {\n      if (inv.status !== 'PAID') {\n        outstandingInvoices += inv.remaining_amount || 0;\n      }",
  `let totalSales = 0;
    let outstandingInvoices = 0;
    let outstandingAp = 0;

    // Separate invoices
    invoices.forEach((inv) => {
      if (inv.status !== 'PAID' && inv.status !== 'CANCELLED') {
        if (inv.type === 'AP') {
          outstandingAp += inv.remaining_amount || 0;
        } else {
          outstandingInvoices += inv.remaining_amount || 0;
        }
      }`
);

c = c.replace(
  "finance: {\n        outstandingAmount: outstandingInvoices,\n        invoiceCount: invoices.length,\n        invoices,\n        payments,\n      },",
  `finance: {\n        outstandingAmount: outstandingInvoices,\n        outstandingAp,\n        netBalance: outstandingInvoices - outstandingAp,\n        invoiceCount: invoices.length,\n        invoices,\n        payments,\n      },`
);

// We should also fetch and include nettings!
c = c.replace(
  "const payments = await this.prisma.payment.findMany({",
  "const nettings = await this.prisma.netting.findMany({ where: { partner_id: customerId, company_id: companyId }, orderBy: { date: 'desc' }});\n    const payments = await this.prisma.payment.findMany({"
);

c = c.replace(
  "invoiceCount: invoices.length,\n        invoices,\n        payments,\n      },",
  "invoiceCount: invoices.length,\n        invoices,\n        payments,\n        nettings,\n      },"
);

fs.writeFileSync('backend/src/crm/crm.service.ts', c);
