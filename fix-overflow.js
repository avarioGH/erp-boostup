const fs = require('fs');
const files = [
  'frontend/src/app/purchasing/orders/create/page.tsx',
  'frontend/src/app/purchasing/rfqs/create/page.tsx',
  'frontend/src/app/sales/orders/create/page.tsx',
  'frontend/src/app/sales/quotations/create/page.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<Card>\n          <CardHeader className="flex flex-row justify-between items-center pb-2">\n            <CardTitle>Rincian Barang',
    '<Card className="overflow-visible">\n          <CardHeader className="flex flex-row justify-between items-center pb-2">\n            <CardTitle>Rincian Barang'
  );
  content = content.replace(
    '<Card>\n          <CardHeader className="flex flex-row items-center justify-between">\n            <CardTitle>Rincian Barang',
    '<Card className="overflow-visible">\n          <CardHeader className="flex flex-row items-center justify-between">\n            <CardTitle>Rincian Barang'
  );
  
  // also handle standard Card without classes
  content = content.replace(
    /<Card>\s*<CardHeader[^>]*>\s*<CardTitle>Rincian Barang/g,
    '<Card className="overflow-visible">\n          <CardHeader className="flex flex-row items-center justify-between">\n            <CardTitle>Rincian Barang'
  );
  fs.writeFileSync(file, content);
}
console.log('Fixed overflow in Card for Rincian Barang');
