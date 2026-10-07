const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/orders/page.tsx', 'utf8');

s = s.replace(
  /<Link href=\{\`\/sales\/orders\/\$\{details\.id\}\/print\`\} target="_blank"><Button variant="outline"><Printer className="w-4 h-4 mr-2" \/> Cetak Surat Jalan<\/Button><\/Link>/g,
  ""
);

s = s.replace(
  /<Button onClick=\{\(\) => router\.push\("\/sales\/deliveries"\)\} className="">\s*<Truck className="w-4 h-4 mr-2" \/> Create Delivery\s*<\/Button>/g,
  `<Button onClick={() => router.push(\`/sales/deliveries/create?so_id=\${details.id}\`)} className=""><Truck className="w-4 h-4 mr-2" /> Buat Pengiriman (Surat Jalan)</Button>`
);

fs.writeFileSync('frontend/src/app/sales/orders/page.tsx', s);
console.log('Patched orders page buttons');
