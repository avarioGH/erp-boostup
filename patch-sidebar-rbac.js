const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/ikan-sidebar.tsx', 'utf8');

c = c.replace(/if \(!item\.id \|\| user\?\.role === 'Owner'\) return true;/g, `
      const role = (user?.role || '').toLowerCase();
      if (!item.id || role === 'owner' || role === 'admin') return true;
`);

c = c.replace(/if \(user\?\.role !== 'Owner'\) return false;/g, `
      const role = (user?.role || '').toLowerCase();
      if (role !== 'owner' && role !== 'admin') return false;
`);

fs.writeFileSync('frontend/src/components/ikan-sidebar.tsx', c);

console.log('Sidebar RBAC relaxed for Owner/Admin case insensitivity');
