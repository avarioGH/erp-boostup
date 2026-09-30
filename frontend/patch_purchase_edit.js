const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/purchase/[id]/edit/page.tsx', 'utf8');

code = code.replace(/setSawnItems\(([\s\S]*?)\);\s*}/, 'setForm(prev => ({ ...prev, items:  })); }');
code = code.replace(/setLogItems\(([\s\S]*?)\);\s*}/, 'setForm(prev => ({ ...prev, logItems:  })); }');

fs.writeFileSync('src/app/inventory/purchase/[id]/edit/page.tsx', code);
