const fs = require('fs');
let file = 'frontend/src/app/inventory/inflow/tambah/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the active_warehouse parsing
content = content.replace(
  `        const active = localStorage.getItem('active_warehouse')
        if (active && active !== 'all') {
          setLockedWarehouse(true)
          setForm(prev => ({ ...prev, warehouse_id: active }))
        }`,
  `        const active = localStorage.getItem('active_warehouse')
        if (active && active !== 'all') {
          try {
            const parsed = JSON.parse(active);
            if (parsed && parsed.id) {
              setLockedWarehouse(true);
              setForm(prev => ({ ...prev, warehouse_id: parsed.id }));
            }
          } catch(e) {
            setLockedWarehouse(true);
            setForm(prev => ({ ...prev, warehouse_id: active }));
          }
        }`
);

// Fix the hardcoded placeholder in SearchableSelect
content = content.replace(
  /placeholder=\{selectedOption \? selectedOption\.name : `Pilih Ikan\.\.\. \(Total: \$\{options\?\.length \|\| 0\}\)`\}/g,
  'placeholder={selectedOption ? selectedOption.name : placeholder || `Pilih... (Total: ${options?.length || 0})`}'
);

fs.writeFileSync(file, content);
