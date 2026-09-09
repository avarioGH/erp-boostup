const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
code = code.replace('@relation(fields: [chart_of_account_id], references: [id], onDelete: NoAction, onUpdate: NoAction)  @default("IDR")', '@relation(fields: [chart_of_account_id], references: [id], onDelete: NoAction, onUpdate: NoAction)');
code = code.replace('currency   String\\n', 'currency   String @default("IDR")\\n');
fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
