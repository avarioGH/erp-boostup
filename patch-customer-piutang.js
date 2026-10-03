const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/crm/customers/page.tsx', 'utf8');

// 1. Sort customers with Piutang on top
const filteredRegex = /const filteredCustomers = customers\s*;/;
// Wait, the current code just assigns customers to filteredCustomers, let's verify how it is currently.
// Oh wait, I checked earlier: "const filteredCustomers = customers\n return ("
const newFiltered = `const filteredCustomers = [...customers].sort((a, b) => {
    const outA = a.totalOutstanding || 0;
    const outB = b.totalOutstanding || 0;
    if (outA > 0 || outB > 0) return outB - outA;
    return 0;
  });`;
// Replace the exact line
content = content.replace(/const filteredCustomers = customers\s*/, newFiltered + '\n');

// 2. Add Piutang Column Header
content = content.replace('<th className="p-3 px-4 text-left font-medium text-muted-foreground">Status</th>', '<th className="p-3 px-4 text-left font-medium text-muted-foreground">Piutang</th>\n <th className="p-3 px-4 text-left font-medium text-muted-foreground">Status</th>');

// 3. Add Piutang Column Cell
const statusCellRegex = /<td className="p-3 px-4">\s*<Badge variant="secondary" className="bg-emerald-100 text-primary hover:bg-emerald-100 dark:bg-emerald-900\/50 dark:text-primary">Active<\/Badge>\s*<\/td>/;
const newStatusCell = `<td className="p-3 px-4">
   {(c.totalOutstanding || 0) > 0 ? (
     <span className="text-red-600 font-bold whitespace-nowrap bg-red-50 px-2 py-1 rounded">Rp {(c.totalOutstanding).toLocaleString('id-ID')}</span>
   ) : (
     <span className="text-muted-foreground text-sm">-</span>
   )}
 </td>
 <td className="p-3 px-4">
 <Badge variant="secondary" className="bg-emerald-100 text-primary hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-primary">Active</Badge>
 </td>`;
content = content.replace(statusCellRegex, newStatusCell);

fs.writeFileSync('frontend/src/app/crm/customers/page.tsx', content);
