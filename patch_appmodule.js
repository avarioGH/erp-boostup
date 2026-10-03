const fs = require("fs");
let content = fs.readFileSync("backend/src/app.module.ts", "utf8");

content = "import { FixController } from './fix.controller';\n" + content;
content = content.replace("controllers: [AppController],", "controllers: [AppController, FixController],");

fs.writeFileSync("backend/src/app.module.ts", content);

