const fs = require('fs');

const filesToPatch = [
  'frontend/src/app/sales/orders/create/page.tsx',
  'frontend/src/app/sales/quotations/create/page.tsx'
];

const commonIcons = ['ArrowLeft', 'Plus', 'X', 'Trash', 'Search', 'Check', 'AlertCircle', 'ChevronDown', 'ChevronUp', 'Loader2', 'Save', 'FileText', 'Calendar', 'Edit', 'Eye'];

filesToPatch.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove asChild
  content = content.replace(/<DialogTrigger asChild>/g, '<DialogTrigger>');
  content = content.replace(/\{\/\*\s*@ts-ignore\s*\*\/\}\\n\s*<DialogTrigger>/g, '<DialogTrigger>');

  // Icons
  const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/;
  const match = content.match(lucideImportRegex);
  let currentImports = match ? match[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const usedIcons = commonIcons.filter(icon => content.includes(`<${icon}`) || content.includes(`${icon} `));
  const newImports = Array.from(new Set([...currentImports, ...usedIcons]));
  
  if (match) {
    content = content.replace(lucideImportRegex, `import { ${newImports.join(', ')} } from 'lucide-react'`);
  } else {
    content = `import { ${newImports.join(', ')} } from "lucide-react";\n` + content;
  }

  fs.writeFileSync(file, content);
});
