const fs = require('fs');
let s = fs.readFileSync('backend/src/app.module.ts', 'utf8');

s = s.replace(
  /export class AppModule implements OnModuleInit \{\n  constructor\(private prisma: import\('.\/prisma\/prisma.service'\).PrismaService\) \{\}/,
  `import { PrismaService } from './prisma/prisma.service';\nexport class AppModule implements OnModuleInit {\n  constructor(private prisma: PrismaService) {}`
);

fs.writeFileSync('backend/src/app.module.ts', s);
console.log('Fixed PrismaService import');
