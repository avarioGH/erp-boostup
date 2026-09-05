const fs = require('fs');
let code = fs.readFileSync('backend/src/app.module.ts', 'utf8');

if (!code.includes('CoreModule')) {
  code = "import { CoreModule } from './core/core.module';\n" + code;
  code = code.replace("imports: [", "imports: [\n    CoreModule,");
}
if (!code.includes('HealthModule')) {
  code = "import { HealthModule } from './health/health.module';\n" + code;
  code = code.replace("imports: [", "imports: [\n    HealthModule,");
}
fs.writeFileSync('backend/src/app.module.ts', code);
