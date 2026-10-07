const fs = require('fs');

// 1. Remove from AppModule
let appMod = fs.readFileSync('backend/src/app.module.ts', 'utf8');
appMod = appMod.replace(/export class AppModule implements OnModuleInit \{[\s\S]*\}\n\}/, 'export class AppModule {}');
appMod = appMod.replace(/import \{ OnModuleInit \} from '@nestjs\/common';\n/, '');
appMod = appMod.replace(/import \{ PrismaService \} from '.\/prisma\/prisma.service';\n/, '');
fs.writeFileSync('backend/src/app.module.ts', appMod);

// 2. Add to PrismaService
let prismaSrv = fs.readFileSync('backend/src/prisma/prisma.service.ts', 'utf8');
const migrationLogic = `
  async onModuleInit() {
    await this.$connect();
    // Auto-migrate null warehouse_id to Gudang A
    try {
      const warehouses = await this.warehouse.findMany({});
      const gudangA = warehouses.find(w => w.name.toLowerCase().includes('a'));
      if (gudangA) {
        await this.salesOrder.updateMany({
          where: { warehouse_id: { isSet: false } },
          data: { warehouse_id: gudangA.id }
        });
      }
    } catch(e) {}
  }
`;
prismaSrv = prismaSrv.replace(/async onModuleInit\(\) \{\n\s*await this\.\$connect\(\);\n\s*\}/, migrationLogic);
fs.writeFileSync('backend/src/prisma/prisma.service.ts', prismaSrv);

console.log('Moved migration to PrismaService');
