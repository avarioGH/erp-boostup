const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/customers/page.tsx', 'utf8');

if (!s.includes('totalPayable: number;')) {
  s = s.replace(
    'totalOutstanding: number;',
    'totalOutstanding: number;\n  totalPayable: number;'
  );
}

s = s.replace(
  /<TableHead className="text-right">Total Dibayar<\/TableHead>\s*<TableHead className="text-right">Piutang<\/TableHead>/m,
  `<TableHead className="text-right">Total Dibayar</TableHead>
                <TableHead className="text-right">Piutang Kustomer</TableHead>
                <TableHead className="text-right">Hutang Kita (Vendor)</TableHead>`
);

s = s.replace(
  /<TableCell className="text-right text-destructive font-medium">\s*\{new Intl\.NumberFormat\("id-ID", \{\s*style: "currency",\s*currency: "IDR",\s*maximumFractionDigits: 0,\s*\}\)\.format\(customer\.totalOutstanding \|\| 0\)\}\s*<\/TableCell>/m,
  `<TableCell className="text-right text-destructive font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(customer.totalOutstanding || 0)}
                  </TableCell>
                  <TableCell className="text-right text-amber-500 font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(customer.totalPayable || 0)}
                  </TableCell>`
);

fs.writeFileSync('frontend/src/app/sales/customers/page.tsx', s);
console.log('Patched frontend UI for payable');
