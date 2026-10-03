const fs = require('fs');
let file = 'frontend/src/app/inventory/disposals/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The card with Barang Dimusnahkan
content = content.replace(
  /<Card className="bg-\[#0f172a\] text-white border-border">\s*<CardHeader className="flex flex-row items-center justify-between">\s*<CardTitle className="text-lg">Barang Dimusnahkan/g,
  '<Card className="bg-[#0f172a] text-white border-border overflow-visible">\n          <CardHeader className="flex flex-row items-center justify-between">\n            <CardTitle className="text-lg">Barang Dimusnahkan'
);

fs.writeFileSync(file, content);
console.log('Fixed disposals page overflow');
