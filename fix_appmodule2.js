const fs = require("fs");
let content = fs.readFileSync("backend/src/app.module.ts", "utf8");

content = "import { TimberSalesModule } from './sales/timber-sales.module';\n" + content;
content = content.replace("imports: [", "imports: [\n    TimberSalesModule,");

fs.writeFileSync("backend/src/app.module.ts", content);

