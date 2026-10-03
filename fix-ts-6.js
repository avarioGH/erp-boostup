const fs = require('fs');
let file = 'frontend/src/app/sales/orders/create/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// List of common lucide icons to import
const commonIcons = ['ArrowLeft', 'Plus', 'X', 'Trash', 'Search', 'Check', 'AlertCircle', 'ChevronDown', 'ChevronUp', 'Loader2', 'Save', 'FileText', 'Calendar'];

const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/;
const match = content.match(lucideImportRegex);

let currentImports = match ? match[1].split(',').map(s => s.trim()).filter(Boolean) : [];

// Find which icons are used in the file
const usedIcons = commonIcons.filter(icon => content.includes(`<${icon}`) || content.includes(`${icon} `));

// Add missing ones
const newImports = Array.from(new Set([...currentImports, ...usedIcons]));

if (match) {
  content = content.replace(lucideImportRegex, `import { ${newImports.join(', ')} } from 'lucide-react'`);
} else {
  content = `import { ${newImports.join(', ')} } from "lucide-react";\n` + content;
}

fs.writeFileSync(file, content);
