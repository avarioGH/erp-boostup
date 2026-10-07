const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/deliveries/create/page.tsx', 'utf8');

if (!s.includes('SearchParams')) {
  s = s.replace(
    'const fetchOrders = async () => {',
    `const fetchOrders = async () => {
    try {
      let initialSoId = '';
      if (typeof window !== 'undefined') {
        initialSoId = new URLSearchParams(window.location.search).get('so_id') || '';
      }`
  );

  s = s.replace(
    /setOrders\(validOrders\)\n\s*\} catch/,
    `setOrders(validOrders)
      if (initialSoId && validOrders.find((o: any) => o.id === initialSoId)) {
        setTimeout(() => handleSelectSo(initialSoId), 100);
      }
    } catch`
  );
}

fs.writeFileSync('frontend/src/app/sales/deliveries/create/page.tsx', s);
console.log('Patched deliveries create to accept so_id');
