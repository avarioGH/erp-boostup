const fs = require('fs');
const path = 'frontend/src/app/manufacturing/orders/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add next/link if not exists
if (!content.includes('import Link from')) {
    content = content.replace("import { useRouter }", "import Link from 'next/link'\nimport { useRouter }");
}

// Replace Button with Link wrapped Button
content = content.replace(
  '<Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Create MO</Button>',
  '<Link href="/manufacturing/orders/create"><Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Create MO</Button></Link>'
);
fs.writeFileSync(path, content, 'utf8');
