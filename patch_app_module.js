const fs = require('fs');
let content = fs.readFileSync('backend/src/app.module.ts', 'utf8');
content = "import { MrpModule } from './mrp/mrp.module';\n" + content;
content = content.replace("ShopeeModule, AiModule, ManufacturingModule", "ShopeeModule, AiModule, ManufacturingModule, MrpModule");
fs.writeFileSync('backend/src/app.module.ts', content, 'utf8');
