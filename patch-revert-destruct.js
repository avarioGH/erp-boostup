const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

c = c.replace(
  /const \{ customer: profile, summary, salesOrders, invoices, payments, nettings, opportunities, activities, timeline \} = data;\s*const finance = [^;]+;\s*const sales = [^;]+;\s*const crm = [^;]+;/s,
  "const { profile, sales, finance, crm, timeline } = data;"
);

// I ALSO need to undo my array renames:
// (salesOrders || []) -> sales.orders
c = c.replace(/\(salesOrders \|\| \[\]\)/g, 'sales.orders');
c = c.replace(/\(quotations \|\| \[\]\)/g, 'sales.quotations');
c = c.replace(/\(deliveries \|\| \[\]\)/g, 'sales.deliveries');
c = c.replace(/\(activities\?\.today \|\| activities \|\| \[\]\)/g, 'crm.activities');
c = c.replace(/\(opportunities \|\| \[\]\)/g, 'crm.opportunities');

// Wait, I also replaced totalInvoiced with totalSales...
c = c.replace(/sales\.totalInvoiced/g, 'sales.totalSales');

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
