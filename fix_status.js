const fs = require('fs');
let code = fs.readFileSync('backend/src/notification/notification.listener.ts', 'utf8');
code = code.replace(/status: 'ACTIVE'/, 'status: true');
fs.writeFileSync('backend/src/notification/notification.listener.ts', code, 'utf8');
