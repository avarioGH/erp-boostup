const fs = require('fs');
let file = 'frontend/src/app/sales/orders/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/;
const match = content.match(lucideImportRegex);
if (match) {
  if (!match[1].includes('ArrowLeft')) {
    content = content.replace(lucideImportRegex, `import { ${match[1]}, ArrowLeft } from 'lucide-react'`);
  }
} else {
  content = 'import { ArrowLeft } from "lucide-react";\n' + content;
}

fs.writeFileSync(file, content);
