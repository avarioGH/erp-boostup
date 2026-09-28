const fs = require('fs');
const filePath = 'frontend/src/components/app-sidebar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('Exports & Shipments')) {
  content = content.replace(
    '          { title: "Point of Sale", url: "/sales/pos" },',
    '          { title: "Point of Sale", url: "/sales/pos" },\n          { title: "Exports & Shipments", url: "/sales/exports" },'
  );
  fs.writeFileSync(filePath, content, 'utf8');
}
