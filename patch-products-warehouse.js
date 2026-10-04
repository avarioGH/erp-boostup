const fs = require('fs');
const path = 'frontend/src/app/inventory/products/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add activeWarehouse state
if (!content.includes('const [activeWarehouse, setActiveWarehouse]')) {
    content = content.replace(
        /const \[warehouses, setWarehouses\] = useState<any\[\]>\(\[\]\)/,
        `const [warehouses, setWarehouses] = useState<any[]>([])\n  const [activeWarehouse, setActiveWarehouse] = useState<any>(null)`
    );
}

// 2. Read from localStorage in useEffect
if (!content.includes('localStorage.getItem("active_warehouse")')) {
    content = content.replace(
        /const \[dbProducts, whs, cats\] = await Promise\.all\(\[/,
        `const storedActive = localStorage.getItem("active_warehouse");
      if (storedActive && storedActive !== "null" && storedActive !== "undefined") {
        setActiveWarehouse(JSON.parse(storedActive));
      } else {
        setActiveWarehouse(null);
      }
      
      const [dbProducts, whs, cats] = await Promise.all([`
    );
}

// 3. Filter warehouses displayed in table header and body
// The table headers map over `warehouses`
content = content.replace(
    /\{warehouses\.map\(\(wh\) => \(/,
    `{warehouses.filter(wh => !activeWarehouse || activeWarehouse.id === wh.id).map((wh) => (`
);

// 4. Update the colSpan logic for empty state
content = content.replace(
    /<TableCell colSpan=\{5 \+ warehouses\.length\} className="h-32 text-center text-muted-foreground">/g,
    `<TableCell colSpan={5 + warehouses.filter(wh => !activeWarehouse || activeWarehouse.id === wh.id).length} className="h-32 text-center text-muted-foreground">`
);

// 5. Update the warehouse mapping in TableBody
content = content.replace(
    /\{warehouses\.map\(\(wh\) => \{/g,
    `{warehouses.filter(wh => !activeWarehouse || activeWarehouse.id === wh.id).map((wh) => {`
);

// 6. Update Total Stok calculation to only sum up visible warehouses if needed, or total stock is overall?
// "gaada yang lain.." meaning if I select Gudang A, I probably want the total stock to be the stock of Gudang A OR still overall?
// If we filter the warehouses array, the total stock might just be overall. We'll leave total stock as overall.

fs.writeFileSync(path, content);
