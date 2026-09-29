const fs = require('fs');
const path = 'frontend/src/app/purchasing/orders/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Button with Link wrapped Button
content = content.replace(
  '<Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Order</Button>',
  '<Link href="/purchasing/orders/create"><Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Order</Button></Link>'
);
fs.writeFileSync(path, content, 'utf8');
