const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

const target = `<Link href="/purchasing/orders"><Button variant="outline" size="sm">Kelola <Navigation className="w-3 h-3 ml-1" /></Button></Link>`;
const replacement = `<div className="flex gap-2">
     <Link href={\`/inventory/purchase-fish/create?partner_id=\${partnerId}\`}>
       <Button size="sm">Tambah Pembelian</Button>
     </Link>
     <Link href="/purchasing/orders">
       <Button variant="outline" size="sm">Kelola <Navigation className="w-3 h-3 ml-1" /></Button>
     </Link>
   </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', code);
console.log('patched partner detail add purchase button');
