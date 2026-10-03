const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/inflow/tambah/page.tsx', 'utf8');

// 1. Add lockedWarehouse state
if (!content.includes('lockedWarehouse')) {
  content = content.replace(
    'const [products, setProducts] = useState<any[]>([])',
    'const [products, setProducts] = useState<any[]>([])\n  const [lockedWarehouse, setLockedWarehouse] = useState(false)'
  );
}

// 2. Update useEffect to read active_warehouse
const useEffectMatch = content.match(/useEffect\(\(\) => \{\n\s*Promise\.all\(\[\n\s*InventoryAPI\.getWarehouses\(\)\.catch\(\(\) => \[\]\),\n\s*InventoryAPI\.getProducts\(\)\.catch\(\(\) => \[\]\)\n\s*\]\)\.then\(\(\[wh, prod\]\) => \{\n\s*setWarehouses\(wh\?\.data \|\| wh \|\| \[\]\)\n\s*setProducts\(prod\?\.data \|\| prod \|\| \[\]\)\n\s*\}\)\n\s*\}, \[\]\)/);

if (useEffectMatch) {
  const newUseEffect = `useEffect(() => {
    Promise.all([
      InventoryAPI.getWarehouses().catch(() => []),
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([wh, prod]) => {
      setWarehouses(wh?.data || wh || [])
      setProducts(prod?.data || prod || [])
      
      if (typeof window !== 'undefined') {
        const active = localStorage.getItem('active_warehouse')
        if (active && active !== 'all') {
          setLockedWarehouse(true)
          setForm(prev => ({ ...prev, warehouse_id: active }))
        }
      }
    })
  }, [])`;
  
  content = content.replace(useEffectMatch[0], newUseEffect);
}

// 3. Update Gudang Tujuan SearchableSelect
const gudangSelectMatch = content.match(/<SearchableSelect\s*options=\{warehouses\}\s*value=\{form\.warehouse_id\}\s*onChange=\{\(v: any\) => setForm\(\{\.\.\.form, warehouse_id: v\}\)\}\s*placeholder="Pilih Gudang\.\.\."\s*\/>/m);

if (gudangSelectMatch) {
  const newGudangSelect = `<SearchableSelect 
                options={warehouses} 
                value={form.warehouse_id} 
                onChange={(v: any) => setForm({...form, warehouse_id: v})} 
                placeholder="Pilih Gudang..."
                disabled={lockedWarehouse}
                renderLabel={(o: any) => o.name}
              />`;
  content = content.replace(gudangSelectMatch[0], newGudangSelect);
}

// 4. Update Product SearchableSelect
const productSelectMatch = content.match(/<SearchableSelect\s*options=\{products\}\s*value=\{item\.product_id\}\s*onChange=\{\(v: any\) => \{\s*const newItems = \[\.\.\.items\];\s*newItems\[i\]\.product_id = v;\s*setItems\(newItems\)\s*\}\}\s*\/>/m);

if (productSelectMatch) {
  const newProductSelect = `<SearchableSelect 
                    options={products} 
                    value={item.product_id} 
                    onChange={(v: any) => {
                      const newItems = [...items];
                      newItems[i].product_id = v;
                      setItems(newItems)
                    }} 
                    renderLabel={(o: any) => \`\${o.name} \${o.weight ? '(' + o.weight + 'g)' : ''}\`}
                  />`;
  content = content.replace(productSelectMatch[0], newProductSelect);
}

fs.writeFileSync('frontend/src/app/inventory/inflow/tambah/page.tsx', content);
