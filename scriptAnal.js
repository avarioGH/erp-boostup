const fs = require('fs');
let code = fs.readFileSync('backend/src/analytics/analytics.service.ts', 'utf8');

code = code.replace(/accountType:/g, 'account_type:');
code = code.replace(/journalEntry:/g, 'journal_entry:');

code = code.replace(/revEntries\._sum\.credit/g, 'revEntries._sum?.credit');
code = code.replace(/revEntries\._sum\.debit/g, 'revEntries._sum?.debit');
code = code.replace(/expEntries\._sum\.credit/g, 'expEntries._sum?.credit');
code = code.replace(/expEntries\._sum\.debit/g, 'expEntries._sum?.debit');

fs.writeFileSync('backend/src/analytics/analytics.service.ts', code);
