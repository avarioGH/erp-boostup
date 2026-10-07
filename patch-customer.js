const fs = require('fs');
let s = fs.readFileSync('backend/src/crm/customer.service.ts', 'utf8');

// In getCustomersWithReceivables
s = s.replace(
  /const salesOrders = await this\.prisma\.salesOrder\.findMany\(\{([\s\S]*?)include: \{ allocations: true \},\s*\}\);/,
  `const salesOrders = await this.prisma.salesOrder.findMany({$1include: { allocations: true },
    });
    
    const apInvoices = await this.prisma.invoice.findMany({
      where: {
        supplier_id: { in: customerIds },
        company_id: companyId,
        type: 'AP',
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      }
    });`
);

s = s.replace(
  /const data = customers\.map\(\(c\) => \{([\s\S]*?)let totalOutstanding = 0;/m,
  `const data = customers.map((c) => {$1let totalOutstanding = 0;\n        let totalPayable = 0;\n        \n        for (const inv of apInvoices) {\n          if (inv.supplier_id === c.id) {\n            totalPayable += inv.remaining_amount;\n          }\n        }`
);

s = s.replace(
  /totalOutstanding,\s*\};\s*\}\);/m,
  `totalOutstanding,\n          totalPayable,\n        };\n      });`
);

fs.writeFileSync('backend/src/crm/customer.service.ts', s);
console.log('Patched customer service for payable');
