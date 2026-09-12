const fs = require("fs");
const file = "backend/src/inventory/inventory.module.ts";
let c = fs.readFileSync(file, "utf8");
c = c.replace(
  "import { SawmillProductionService } from './sawmill-production.service';",
  "import { SawmillProductionService } from './sawmill-production.service';\nimport { ProductionReportController } from './production-reports/production-report.controller';\nimport { ProductionReportService } from './production-reports/production-report.service';"
);
c = c.replace(
  "SawmillProductionController\n  ]",
  "SawmillProductionController,\n    ProductionReportController\n  ]"
);
c = c.replace(
  "SawmillProductionService\n  ]",
  "SawmillProductionService,\n    ProductionReportService\n  ]"
);
fs.writeFileSync(file, c);
