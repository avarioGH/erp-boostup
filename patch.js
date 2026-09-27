const fs = require('fs');
let content = fs.readFileSync('/root/erp-boostup/backend/src/app.module.ts', 'utf8');
if (!content.includes('TimberSalesModule,')) {
  content = content.replace("AuthModule,", "AuthModule, TimberSalesModule,");
}
fs.writeFileSync('/root/erp-boostup/backend/src/app.module.ts', content);
