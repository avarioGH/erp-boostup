const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/products/page.tsx', 'utf8');

// Add MoreHorizontal, Trash2, Edit2 to lucide-react imports if not there
if (!code.includes('MoreHorizontal')) {
  code = code.replace(/import \{([^}]+)\} from "lucide-react"/, 'import {, MoreHorizontal, Trash2, Edit2 } from "lucide-react"');
}

// Add DropdownMenu components to shadcn imports if not there
// Actually, DropdownMenu is already imported! Let's check.
