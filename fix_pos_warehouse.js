const fs = require('fs');
let r = fs.readFileSync('frontend/src/app/pos/new-transaction/page.tsx', 'utf8');

// Fix stock display: show stock for active warehouse only, not all warehouses combined
const oldStock = 'stock: p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0,';
const newStock = `stock: (() => {
     const storedWh2 = typeof window !== 'undefined' ? localStorage.getItem('active_warehouse') : null;
     const activeWh2 = storedWh2 && storedWh2 !== 'null' && storedWh2 !== 'undefined' ? JSON.parse(storedWh2) : null;
     if (activeWh2) {
       const whStock = p.warehouse_stocks?.find((ws: any) => ws.warehouse_id === activeWh2.id);
       return whStock?.current_stock || 0;
     }
     return p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0;
   })(),`;

if (r.includes(oldStock)) {
  r = r.replace(oldStock, newStock);
  fs.writeFileSync('frontend/src/app/pos/new-transaction/page.tsx', r);
  console.log('SUCCESS - stock now shows per active warehouse');
} else {
  console.log('NOT FOUND');
  const idx = r.indexOf('warehouse_stocks');
  console.log(JSON.stringify(r.substring(idx, idx + 100)));
}
