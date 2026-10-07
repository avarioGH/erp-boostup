const fs = require('fs');
let s = fs.readFileSync('backend/src/app.controller.ts', 'utf8');

// Remove PrismaService injection from AppController
s = s.replace(/import \{ PrismaService \} from '.\/prisma\/prisma.service';\n/, '');
s = s.replace(/constructor\(private readonly appService: AppService, private readonly prisma: PrismaService\) \{\}/, 'constructor(private readonly appService: AppService) {}');
s = s.replace(/@Get\('migrate-now'\)[\s\S]*?migrated: true[\s\S]*?\}\n\s*\}/, '');

fs.writeFileSync('backend/src/app.controller.ts', s);
console.log('Cleaned AppController');
