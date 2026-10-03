const fs = require('fs');
let file = 'backend/src/accounting/accounting.listener.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: items: any[] = []
content = content.replace('const items = [];', 'const items: any[] = [];');

// Fix 2: remove extra arguments to resolveAccount
const oldResolve = `    // Piutang account for any unpaid balance
    const arAccountId = await this.resolveAccount(
      tx,
      event.companyId,
      ['1-1004', '1102', 'Piutang'],
      ['Piutang Usaha', 'Accounts Receivable'],
      'AUTO-AR',
      'Debit'
    );`;

const newResolve = `    // Piutang account for any unpaid balance
    const arAccountId = await this.resolveAccount(
      tx,
      event.companyId,
      ['1-1004', '1102', 'Piutang'],
      ['Piutang Usaha', 'Accounts Receivable']
    );`;

content = content.replace(oldResolve, newResolve);
fs.writeFileSync(file, content);
console.log('Fixed typescript errors');
