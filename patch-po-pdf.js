const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

const targetButton = `<Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>`;
const replacementButton = `<Button variant="outline" onClick={() => window.open(\`/api/documents/purchase-orders/\${details.id}/pdf\`, '_blank')}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>`;

code = code.replace(targetButton, replacementButton);
fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched frontend Export PDF button');
