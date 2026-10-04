const fs = require('fs');
const path = 'frontend/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /useEffect\(\(\) => \{\s*async function loadAuxData\(\) \{[\s\S]*?loadAuxData\(\)\s*\}, \[\]\)/,
    `useEffect(() => {
   async function loadAuxData() {
   try {
   const [whs, prods, txs] = await Promise.all([
   InventoryAPI.getWarehouses().catch(() => []),
   InventoryAPI.getProducts().catch(() => []),
   InventoryAPI.getTransactions().catch(() => [])
   ])
   setWarehouses(whs)
   
   // Low stocks calculation strictly from actual data
   const lows = prods.filter((p: any) => {
     let totalStock = 0;
     if (warehouse && warehouse !== 'all') {
       const ws = p.warehouse_stocks?.find((w: any) => w.warehouse_id === warehouse);
       totalStock = ws ? ws.current_stock : 0;
     } else {
       totalStock = p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0;
     }
     return totalStock < (p.minimum_stock || 20);
   }).slice(0, 5).map((p: any) => {
     let totalStock = 0;
     let loc = "Pusat";
     if (warehouse && warehouse !== 'all') {
       const ws = p.warehouse_stocks?.find((w: any) => w.warehouse_id === warehouse);
       totalStock = ws ? ws.current_stock : 0;
       loc = whs.find((w: any) => w.id === warehouse)?.name || "Pusat";
     } else {
       totalStock = p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0;
       loc = p.warehouse_stocks?.[0]?.warehouse?.name || "Pusat";
     }
     return {
       name: p.name,
       stock: totalStock,
       min: p.minimum_stock || 20,
       loc
     }
   })
   setLowStocks(lows)
  
   // Recent Activities strictly from actual transactions
   const filteredTxs = (warehouse && warehouse !== 'all') ? txs.filter((tx: any) => tx.warehouse_id === warehouse) : txs;
   const acts = filteredTxs.slice(0, 5).map((tx: any) => {
   return {
   time: timeAgo(tx.transaction_date),
   title: tx.transaction_type === 'IN' ? 'Barang Masuk' : tx.transaction_type === 'OUT' ? 'Barang Keluar' : 'Transfer Gudang',
   desc: tx.notes || \`Transaksi \${tx.reference_number}\`,
   color: tx.transaction_type === 'IN' ? 'bg-success' : tx.transaction_type === 'OUT' ? 'bg-warning' : 'bg-primary'
   }
   })
   setRecentActivities(acts)
   } catch (e) {
   console.error(e)
   }
   }
   loadAuxData()
   }, [warehouse])`
);

fs.writeFileSync(path, content);
