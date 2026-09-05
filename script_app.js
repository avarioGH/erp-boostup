const fs = require('fs');
let code = fs.readFileSync('backend/src/app.module.ts', 'utf8');

if (!code.includes('ReportsModule')) {
  code = "import { ReportsModule } from './reports/reports.module';\n" + code;
  code = code.replace("imports: [", "imports: [\n    ReportsModule,");
  fs.writeFileSync('backend/src/app.module.ts', code);
}
