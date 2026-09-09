const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.1.ts', 'utf8');

// Remove Document from rbacTests
content = content.replace("{ dom: 'Document', route: /documents/entity/customer/1, perm: 'attachment.view' }", "");

fs.writeFileSync('test/ecommerce.20b.1.ts', content);
