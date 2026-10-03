const fs = require('fs');
let file = 'frontend/src/app/pos/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'className="p-3 bg-gray-50 border rounded text-sm space-y-1"',
  'className="p-3 bg-muted border rounded text-sm space-y-1"'
);
content = content.replace(/text-gray-500/g, 'text-muted-foreground');

fs.writeFileSync(file, content);
console.log('Fixed dark mode text visibility in pos/reports/page.tsx');
