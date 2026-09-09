const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
code = code.replace(
  'closed_periods           AccountingPeriod[]   @relation("ClosedPeriods")',
  'closed_periods           AccountingPeriod[]   @relation("ClosedPeriods")\n  requested_approvals ApprovalRequest[] @relation("RequestedApprovals")'
);
fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
