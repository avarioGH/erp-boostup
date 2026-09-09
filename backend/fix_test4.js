const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.1.ts', 'utf8');

// I'll just use a splice
const lines = content.split('\n');
const newLines = lines.filter(l => !l.includes('{ dom: \'Document\', route: \/documents/entity/customer/1\', perm: \'attachment.view\' }'));

fs.writeFileSync('test/ecommerce.20b.1.ts', newLines.join('\n'));
