const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

const jeFindOld = `const je = await prisma.journalEntry.findFirst({ include: { items: true } });
      results.H = je ? 'PASS' : 'FAIL - No JE generated';`;
const jeFindNew = `const jes = await prisma.journalEntry.findMany({ include: { items: true } });
      results.H = jes.length > 0 ? 'PASS' : 'FAIL - No JE generated. Count: ' + jes.length;`;
code = code.replace(jeFindOld, jeFindNew);

fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
