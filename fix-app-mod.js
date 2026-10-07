const fs = require('fs');
let s = fs.readFileSync('backend/src/app.module.ts', 'utf8');

s = s.replace(/import \{ OnModuleInit \} from '@nestjs\/common';\n/, "");
s = "import { OnModuleInit } from '@nestjs/common';\n" + s;

fs.writeFileSync('backend/src/app.module.ts', s);
console.log('Fixed imports');
