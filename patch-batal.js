const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "<Button onClick={handleNetting} disabled={!nettingAmount}>",
  "<Button type=\"button\" variant=\"outline\" onClick={() => setNettingModalOpen(false)}>Batal</Button>\n              <Button onClick={handleNetting} disabled={!nettingAmount}>"
);

fs.writeFileSync(path, code);
console.log('added Batal button');
