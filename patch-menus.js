const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');
c = c.replace(
  '{ title: "Ikan Masuk", url: "/inventory/inflow" },',
  '{ title: "Pembelian Ikan (Nelayan)", url: "/inventory/purchase-fish/create" },\n { title: "Pengolahan Stok (Repacking)", url: "/inventory/fish-processing/create" },\n { title: "Ikan Masuk", url: "/inventory/inflow" },'
);
fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);
console.log('Added menus');
