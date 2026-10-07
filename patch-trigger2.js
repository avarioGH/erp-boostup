const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "<Dialog>",
  "<Dialog open={nettingModalOpen} onOpenChange={setNettingModalOpen}>"
);

fs.writeFileSync(path, code);
console.log('patched to be controlled');
