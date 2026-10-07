const fs = require('fs');

function patchFile(path) {
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace(/const payload = \{\n\s*\.\.\.form,/g, "const payload = {\n        ...form,\n        supplierId: form.partnerId,");
  fs.writeFileSync(path, s);
}

patchFile('frontend/src/app/purchasing/orders/create/page.tsx');
patchFile('frontend/src/app/purchasing/rfqs/create/page.tsx');
console.log('Patched PO and RFQ');
