const fs = require('fs');
let s = fs.readFileSync('backend/src/app.module.ts', 'utf8');

s = s.replace(/import \{ PrismaService \} from '.\/prisma\/prisma\.service';\n/, "");
s = "import { PrismaService } from './prisma/prisma.service';\n" + s;

fs.writeFileSync('backend/src/app.module.ts', s);
console.log('Fixed PrismaService import position');
