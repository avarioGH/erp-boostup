const fs = require('fs');
const path = 'frontend/src/app/sales/orders/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import Link from 'next/link'")) {
  content = content.replace("import { Button }", "import Link from 'next/link'\nimport { Button }");
}
content = content.replace(
  '<Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Order</Button>',
  '<Link href="/sales/orders/create"><Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Order</Button></Link>'
);

fs.writeFileSync(path, content, 'utf8');
