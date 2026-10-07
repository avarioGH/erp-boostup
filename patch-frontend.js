const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
const modalCode = fs.readFileSync('netting-modal.tsx', 'utf8');

if (!code.includes('NETTING MODAL')) {
  const lastIndex = code.lastIndexOf('</div>');
  code = code.substring(0, lastIndex) + modalCode + '\n' + code.substring(lastIndex);
  fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', code);
  console.log('Netting modal added.');
} else {
  console.log('Already exists.');
}
