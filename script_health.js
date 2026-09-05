const fs = require('fs');
let code = fs.readFileSync('backend/src/health/health.controller.ts', 'utf8');
code = code.replace("await this.prisma.$queryRaw`SELECT 1`;", "await this.prisma.$runCommandRaw({ ping: 1 });");
fs.writeFileSync('backend/src/health/health.controller.ts', code);
