const fs = require('fs');
const path = 'frontend/src/app/inventory/purchase-fish/create/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add isWarehouseLocked state
code = code.replace(
  /const \[notaData, setNotaData\] = useState<any>\(null\)/,
  `const [notaData, setNotaData] = useState<any>(null)\n  const [isWarehouseLocked, setIsWarehouseLocked] = useState(false)`
);

// Add logic to set initial warehouse and lock it
code = code.replace(
  /setProducts\(prRes\.data \|\| \[\]\)/,
  `setProducts(prRes.data || [])\n\n        const stored = localStorage.getItem('active_warehouse');\n        if (stored) {\n          try {\n            const parsed = JSON.parse(stored);\n            if (parsed && parsed.id && parsed.id !== 'all') {\n              setFormData(prev => ({ ...prev, warehouse_id: parsed.id }));\n              setIsWarehouseLocked(true);\n            }\n          } catch (e) {}\n        }`
);

// Add disabled prop to the Select
code = code.replace(
  /<Select value=\{formData\.warehouse_id\} onValueChange=\{\(val\) => setFormData\(\{\.\.\.formData, warehouse_id: \nval \|\| ""\}\)\}>/,
  `<Select value={formData.warehouse_id} onValueChange={(val) => setFormData({...formData, warehouse_id: val || ""})} disabled={isWarehouseLocked}>`
);
code = code.replace(
  /<Select value=\{formData\.warehouse_id\} onValueChange=\{\(val\) => setFormData\(\{\.\.\.formData, warehouse_id: val \|\| ""\}\)\}>/,
  `<Select value={formData.warehouse_id} onValueChange={(val) => setFormData({...formData, warehouse_id: val || ""})} disabled={isWarehouseLocked}>`
);


fs.writeFileSync(path, code);
console.log('Fixed Purchase Fish Page');
