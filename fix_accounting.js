const fs = require('fs');
let r = fs.readFileSync('backend/src/accounting/accounting.listener.ts', 'utf8');

// Fix: add required 'code' field to accountType.create
const oldLine = "      act = await tx.accountType.create({ data: { name: 'Auto Generated', normal_balance: 'Debit' } });";
const newLine = "      act = await tx.accountType.create({ data: { name: 'Auto Generated', normal_balance: 'Debit', code: 'AUTO-' + Date.now() } });";

const oldLineCRLF = oldLine + '\r';
const newLineCRLF = newLine + '\r';

if (r.includes(oldLineCRLF)) {
  r = r.replace(oldLineCRLF, newLineCRLF);
  fs.writeFileSync('backend/src/accounting/accounting.listener.ts', r);
  console.log('SUCCESS (CRLF)');
} else if (r.includes(oldLine)) {
  r = r.replace(oldLine, newLine);
  fs.writeFileSync('backend/src/accounting/accounting.listener.ts', r);
  console.log('SUCCESS (LF)');
} else {
  console.log('FAIL - checking file...');
  const idx = r.indexOf('Auto Generated');
  console.log(JSON.stringify(r.substring(idx - 20, idx + 150)));
}
