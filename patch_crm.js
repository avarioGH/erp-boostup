const fs = require("fs");
let content = fs.readFileSync("backend/src/crm/crm.service.ts", "utf8");

content = content.replace("const salesOrders = await this.prisma.salesOrder.findMany({", "const salesOrders = await this.prisma.salesOrder.findMany({ include: { allocations: true },");

const calcLogicOld = `let totalSales = 0;
      let outstandingInvoices = 0;

      invoices.forEach(inv => {
        if (inv.status !== 'PAID') {
          outstandingInvoices += inv.remaining_amount || 0;
        }
        if (inv.status === 'POSTED' && inv.type === 'AR' && (!inv.sales_order || !inv.sales_order.pos_shift_id)) {
          totalSales += inv.total;
        }
      });`;

const calcLogicNew = `let totalSales = 0;
      let outstandingInvoices = 0;

      // Old invoice logic
      invoices.forEach(inv => {
        if (inv.status !== 'PAID') {
          outstandingInvoices += inv.remaining_amount || 0;
        }
        if (inv.status === 'POSTED' && inv.type === 'AR' && (!inv.sales_order || !inv.sales_order.pos_shift_id)) {
          totalSales += inv.total;
        }
      });

      // New SalesOrder Piutang logic
      salesOrders.forEach(so => {
         if (so.status !== "CANCELLED") {
             totalSales += so.total_amount;
             const paid = so.allocations?.reduce((acc, a) => acc + a.amount, 0) || 0;
             const outst = so.total_amount - paid;
             if (outst > 0) outstandingInvoices += outst;
         }
      });`;

content = content.replace(/let totalSales = 0;[\s\S]*?\}\);/, calcLogicNew);
fs.writeFileSync("backend/src/crm/crm.service.ts", content);

