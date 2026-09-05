const fs = require('fs');
let reportService = fs.readFileSync('src/reports/report.service.ts', 'utf8');
reportService = reportService.replace("this.prisma.journal_entryItem.findMany", "this.prisma.journalEntryItem.findMany");
fs.writeFileSync('src/reports/report.service.ts', reportService);
