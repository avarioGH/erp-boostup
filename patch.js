const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/exports/create/page.tsx', 'utf8');

if (!s.includes('useEffect')) {
  s = s.replace('import { useState }', 'import { useState, useEffect }');
}

if (!s.includes('dbCustomers')) {
  s = s.replace(
    'import { exportShipment } from "@/lib/api"',
    'import { exportShipment, api, B2BApi, InventoryAPI } from "@/lib/api"'
  );

  const stateCode = `
  // DB Data
  const [dbCustomers, setDbCustomers] = useState<any[]>([])
  const [dbProducts, setDbProducts] = useState<any[]>([])
  const [dbOrders, setDbOrders] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=100').then(res => setDbCustomers(res.data.data || res.data)).catch(()=> {}),
      InventoryAPI.getProducts().then(res => setDbProducts(res.data || res)).catch(()=> {}),
      B2BApi.getOrders({ limit: 100 }).then(res => setDbOrders((res?.data || []).filter((o:any) => o.order_number?.startsWith('SO')))).catch(()=> {})
    ])
  }, [])

  const handleSelectOrder = async (gIdx: number, orderId: string) => {
    if (!orderId) return;
    try {
      const order = await B2BApi.getOrder(orderId);
      const newGroups = [...groups];
      newGroups[gIdx].groupName = order.customer?.name || "Customer";
      
      const newItems = (order.items || []).map((i: any) => ({
        productName: i.product?.name || "Item",
        qtyKg: i.qty.toString(),
        qtyMc: "",
        qtySak: ""
      }));
      
      if (newItems.length > 0) {
        newGroups[gIdx].items = newItems;
      }
      setGroups(newGroups);
    } catch(e) {}
  }

  // Grouped state
  `;
  s = s.replace('  // Grouped state', stateCode);

  const datalists = `
        <datalist id="customers-list">
          {dbCustomers.map(c => <option key={c.id} value={c.name} />)}
        </datalist>
        <datalist id="products-list">
          {dbProducts.map(p => <option key={p.id} value={p.name} />)}
        </datalist>
        <form onSubmit={handleSubmit}`;
  s = s.replace('<form onSubmit={handleSubmit}', datalists);

  const groupInput = `<Input 
                    placeholder="Misal: PAK BUDI" 
                    value={group.groupName} 
                    onChange={e => updateGroupName(gIdx, e.target.value)} 
                    required 
                  />`;
  const newGroupInput = `<div className="flex gap-2 w-full">
                    <Input 
                      placeholder="Ketik/Pilih Customer" 
                      list="customers-list"
                      value={group.groupName} 
                      onChange={e => updateGroupName(gIdx, e.target.value)} 
                      required 
                      className="flex-1"
                    />
                    <select 
                      className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      onChange={e => handleSelectOrder(gIdx, e.target.value)}
                    >
                      <option value="">-- Ambil dari Pesanan SO --</option>
                      {dbOrders.map(o => (
                        <option key={o.id} value={o.id}>{o.order_number} ({o.customer?.name})</option>
                      ))}
                    </select>
                  </div>`;
  s = s.replace(groupInput, newGroupInput);

  const prodInput = `<Input placeholder="" value={item.productName} onChange={e => updateItem(gIdx, iIdx, 'productName', e.target.value)} required />`;
  const newProdInput = `<Input placeholder="Ketik/Pilih Barang" list="products-list" value={item.productName} onChange={e => updateItem(gIdx, iIdx, 'productName', e.target.value)} required />`;
  // use replaceAll for product inputs
  s = s.replaceAll(prodInput, newProdInput);
}

fs.writeFileSync('frontend/src/app/sales/exports/create/page.tsx', s);
console.log('Patched in JS');
