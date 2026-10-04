const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');

c = c.replace(/if \(!item\.id \|\| role === 'owner' \|\| role === 'admin'\) return true;/g, `
      const role = (user?.role || '').toLowerCase();
      if (!item.id || role === 'owner' || role === 'admin') return true;
`);

fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);
