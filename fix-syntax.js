const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/deliveries/create/page.tsx', 'utf8');

s = s.replace(
  /const fetchOrders = async \(\) => \{\n    try \{\n      let initialSoId = '';\n      if \(typeof window !== 'undefined'\) \{\n        initialSoId = new URLSearchParams\(window\.location\.search\)\.get\('so_id'\) \|\| '';\n      \}\n    try \{/,
  `const fetchOrders = async () => {
    let initialSoId = '';
    if (typeof window !== 'undefined') {
      initialSoId = new URLSearchParams(window.location.search).get('so_id') || '';
    }
    try {`
);

fs.writeFileSync('frontend/src/app/sales/deliveries/create/page.tsx', s);
console.log('Fixed syntax error');
