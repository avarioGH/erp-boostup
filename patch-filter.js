const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const filterLogic = `
  const filteredQuotations = sales?.quotations?.filter((q: any) => {
    const matchSearch = q.quotation_number?.toLowerCase().includes(salesSearch.toLowerCase());
    const qDate = new Date(q.quotation_date || q.created_at);
    const matchStart = salesStartDate ? qDate >= new Date(salesStartDate) : true;
    const matchEnd = salesEndDate ? qDate <= new Date(salesEndDate) : true;
    return matchSearch && matchStart && matchEnd;
  }) || [];

  const filteredOrders = sales?.orders?.filter((so: any) => {
    const matchSearch = so.order_number?.toLowerCase().includes(salesSearch.toLowerCase());
    const soDate = new Date(so.order_date || so.created_at);
    const matchStart = salesStartDate ? soDate >= new Date(salesStartDate) : true;
    const matchEnd = salesEndDate ? soDate <= new Date(salesEndDate) : true;
    return matchSearch && matchStart && matchEnd;
  }) || [];

  return (`;

code = code.replace(
  /\n\s*return \(\n\s*<div className="space-y-6 pb-12 animate-in fade-in duration-300">/,
  filterLogic + `\n    <div className="space-y-6 pb-12 animate-in fade-in duration-300">`
);

fs.writeFileSync(path, code);
console.log('patched filter logic');
