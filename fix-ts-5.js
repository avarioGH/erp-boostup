const fs = require('fs');
let file = 'frontend/src/app/sales/orders/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/;
const match = content.match(lucideImportRegex);
if (match) {
  if (!match[1].includes('Plus')) {
    content = content.replace(lucideImportRegex, `import { ${match[1]}, Plus } from 'lucide-react'`);
  }
} else {
  content = 'import { Plus } from "lucide-react";\n' + content;
}

fs.writeFileSync(file, content);
