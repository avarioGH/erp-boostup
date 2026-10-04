const fs = require('fs');
const path = 'frontend/src/app/inventory/products/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /\{visibleColumns\.totalStock && <TableHead className="text-center font-bold">Total Stok<\/TableHead>\}/,
    `{visibleColumns.totalStock && !activeWarehouse && <TableHead className="text-center font-bold">Total Stok</TableHead>}`
);

content = content.replace(
    /\{visibleColumns\.totalStock && \(\s*<TableCell className="text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50\/50 dark:bg-indigo-900\/20">/g,
    `{visibleColumns.totalStock && !activeWarehouse && (
   <TableCell className="text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20">`
);

fs.writeFileSync(path, content);
