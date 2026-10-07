const fs = require('fs');
let s = fs.readFileSync('backend/src/app.module.ts', 'utf8');

const migrationCode = `
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
@Module({
  // ...
})
export class AppModule implements OnModuleInit {
  constructor(private prisma: PrismaService) {}
  async onModuleInit() {
    try {
      const warehouses = await this.prisma.warehouse.findMany({});
      const gudangA = warehouses.find(w => w.name.toLowerCase().includes('gudang a') || w.name.toLowerCase() === 'a');
      if (gudangA) {
        await this.prisma.salesOrder.updateMany({
          where: { warehouse_id: { isSet: false } },
          data: { warehouse_id: gudangA.id }
        });
        console.log('Migrated old SalesOrders to Gudang A');
      }
    } catch(e) {}
  }
}
`;

if (!s.includes('onModuleInit')) {
  s = s.replace(/export class AppModule \{\}/, `import { OnModuleInit } from '@nestjs/common';\nexport class AppModule implements OnModuleInit {\n  constructor(private prisma: import('./prisma/prisma.service').PrismaService) {}\n  async onModuleInit() {\n    try {\n      const warehouses = await this.prisma.warehouse.findMany({});\n      const gudangA = warehouses.find(w => w.name.toLowerCase().includes('a'));\n      if (gudangA) {\n        await this.prisma.salesOrder.updateMany({\n          where: { warehouse_id: { isSet: false } },\n          data: { warehouse_id: gudangA.id }\n        });\n        console.log('Migrated old SalesOrders to Gudang A');\n      }\n    } catch(e) {}\n  }\n}`);
  fs.writeFileSync('backend/src/app.module.ts', s);
}
console.log('Added onModuleInit migration');
