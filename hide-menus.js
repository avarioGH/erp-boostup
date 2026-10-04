const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');

c = c.replace(/const hiddenForIkan = \['inventory', 'production', 'sales', 'pos', 'crm', 'finance'\];/g, 
"const hiddenForIkan = ['inventory', 'production', 'sales', 'pos', 'crm', 'finance', 'purchasing', 'manufacturing'];");

fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);
console.log('Hidden purchasing and manufacturing');
