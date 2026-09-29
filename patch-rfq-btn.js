const fs = require('fs');
const path = 'frontend/src/app/purchasing/rfqs/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Button with Link wrapped Button
content = content.replace(
  '<Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New RFQ</Button>',
  '<Link href="/purchasing/rfqs/create"><Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New RFQ</Button></Link>'
);
fs.writeFileSync(path, content, 'utf8');
