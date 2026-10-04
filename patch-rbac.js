const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');

c = c.replace(
/const hiddenForIkan = \['inventory', 'production', 'sales', 'pos', 'crm', 'finance'\];\s+if \(item\.id && hiddenForIkan\.includes\(item\.id\)\) return false;\s+return true; \/\/ Bypass accessible modules for Ikan/g,
`const hiddenForIkan = ['inventory', 'production', 'sales', 'pos', 'crm', 'finance'];
      if (item.id && hiddenForIkan.includes(item.id)) return false;
      if (!item.id || user?.role === 'Owner') return true;
      const idMap: any = { ikan_master_data: 'inventory', ikan_inventory: 'inventory', ikan_reports: 'reports', ikan_sales: 'pos' };
      const reqId = idMap[item.id] || item.id;
      if (!user?.accessible_modules) return false;
      return user.accessible_modules.includes(reqId);`
);

c = c.replace(
/const isIkan = true;\s+if \(isIkan\) return true;/g,
`const isIkan = true;
 if (user?.role !== 'Owner') return false; // Settings only for owner in this simplified RBAC`
);

fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);
console.log('Patched ikan-sidebar.tsx RBAC');
