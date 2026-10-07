const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "<Button size=\"sm\" onClick={() => setNettingModalOpen(true)}>Kompensasi</Button>",
  "<Button type=\"button\" size=\"sm\" onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log('Opening Netting Modal'); setNettingModalOpen(true); }}>Kompensasi</Button>"
);

fs.writeFileSync(path, code);
console.log('patched button');
