const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');

c = c.replace(
  "const role = (user?.role || '').toLowerCase();\n      if (role !== 'owner' && role !== 'admin') return false;",
  "const ur = (user?.role || '').toLowerCase();\n      if (ur !== 'owner' && ur !== 'admin') return false;"
);

c = c.replace(
  "const role = (user?.role || '').toLowerCase();\n        if (role !== 'owner' && role !== 'admin') return false;",
  "const ur = (user?.role || '').toLowerCase();\n      if (ur !== 'owner' && ur !== 'admin') return false;"
);

fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);
