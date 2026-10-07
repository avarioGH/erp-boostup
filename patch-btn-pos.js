const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/orders/page.tsx', 'utf8');

s = s.replace(
  /<Button variant="outline"><Download className="w-4 h-4 mr-2" \/> Export<\/Button>/g,
  `<Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
  <Button onClick={() => router.push(\`/sales/deliveries/create?so_id=\${details.id}\`)} variant="outline"><Truck className="w-4 h-4 mr-2" /> Buat Surat Jalan (Pengiriman)</Button>`
);

// Remove the one below
s = s.replace(
  /\{\(details\.status === 'CONFIRMED' \|\| details\.status === 'COMPLETED'\) && \(\s*<Button onClick=\{\(\) => router\.push\(`\/sales\/deliveries\/create\?so_id=\$\{details\.id\}`\)\} className=""><Truck className="w-4 h-4 mr-2" \/> Buat Pengiriman \(Surat Jalan\)<\/Button>\s*\)\}/g,
  ""
);

fs.writeFileSync('frontend/src/app/sales/orders/page.tsx', s);
console.log('Patched buttons again');
