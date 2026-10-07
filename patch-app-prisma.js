const fs = require('fs');
let s = fs.readFileSync('backend/src/app.controller.ts', 'utf8');

s = s.replace(/import \{ AppService \} from '.\/app.service';/, "import { AppService } from './app.service';\nimport { PrismaService } from './prisma/prisma.service';");
s = s.replace(/constructor\(private readonly appService: AppService\) \{\}/, "constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}");

fs.writeFileSync('backend/src/app.controller.ts', s);
console.log('Injected PrismaService');
