const fs = require('fs');
const path = require('path');

// ==========================================
// 1. Create notification.module.ts
// ==========================================
const notifModuleContent = `import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationListener } from './notification.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
`;
fs.writeFileSync('backend/src/notification/notification.module.ts', notifModuleContent);
console.log('✅ Created notification.module.ts');

// ==========================================
// 2. Add sendToOwners to notification.service.ts
// ==========================================
let notifService = fs.readFileSync('backend/src/notification/notification.service.ts', 'utf8');
if (!notifService.includes('sendToOwners')) {
  const insertBefore = '\n}\n';
  const newMethod = `
  async sendToOwners(companyId: string, data: Omit<CreateNotificationDto, 'companyId' | 'userId'>) {
    try {
      const owners = await (this.prisma as any).user.findMany({
        where: { company_id: companyId, status: true },
        include: { role: true }
      });
      const ownerUsers = owners.filter((u: any) =>
        u.role?.name?.toLowerCase().includes('owner') ||
        u.name?.toLowerCase().includes('ikan')
      );
      for (const owner of ownerUsers) {
        await this.send({
          ...data,
          companyId,
          userId: owner.id,
          idempotencyKey: data.idempotencyKey ? \`\${data.idempotencyKey}-\${owner.id}\` : undefined
        });
      }
    } catch (e) {
      this.logger.error('Failed to sendToOwners', e);
    }
  }
`;
  notifService = notifService.replace(/\n}\n$/, newMethod + '\n}\n');
  fs.writeFileSync('backend/src/notification/notification.service.ts', notifService);
  console.log('✅ Added sendToOwners to notification.service.ts');
} else {
  console.log('ℹ️ sendToOwners already exists');
}

// ==========================================
// 3. Update pos.module.ts to include NotificationModule
// ==========================================
let posModule = fs.readFileSync('backend/src/pos/pos.module.ts', 'utf8');
if (!posModule.includes('NotificationModule')) {
  posModule = posModule.replace(
    "import { ReportsModule } from '../reports/reports.module';",
    "import { ReportsModule } from '../reports/reports.module';\nimport { NotificationModule } from '../notification/notification.module';"
  );
  posModule = posModule.replace(
    'imports: [PrismaModule, InventoryModule, ReportsModule]',
    'imports: [PrismaModule, InventoryModule, ReportsModule, NotificationModule]'
  );
  fs.writeFileSync('backend/src/pos/pos.module.ts', posModule);
  console.log('✅ Updated pos.module.ts');
}

// ==========================================
// 4. Update purchasing.module.ts
// ==========================================
let purchModule = fs.readFileSync('backend/src/purchasing/purchasing.module.ts', 'utf8');
if (!purchModule.includes('NotificationModule')) {
  purchModule = purchModule.replace(
    "import { InventoryModule } from '../inventory/inventory.module';",
    "import { InventoryModule } from '../inventory/inventory.module';\nimport { NotificationModule } from '../notification/notification.module';"
  );
  purchModule = purchModule.replace(
    'imports: [PrismaModule, InventoryModule]',
    'imports: [PrismaModule, InventoryModule, NotificationModule]'
  );
  fs.writeFileSync('backend/src/purchasing/purchasing.module.ts', purchModule);
  console.log('✅ Updated purchasing.module.ts');
} else {
  console.log('ℹ️ NotificationModule already in purchasing.module.ts');
}

// ==========================================
// 5. Update hr.module.ts
// ==========================================
let hrModule = fs.readFileSync('backend/src/hr/hr.module.ts', 'utf8');
if (!hrModule.includes('NotificationModule')) {
  hrModule = hrModule.replace(
    "import { PrismaModule } from '../prisma/prisma.module';",
    "import { PrismaModule } from '../prisma/prisma.module';\nimport { NotificationModule } from '../notification/notification.module';"
  );
  hrModule = hrModule.replace(
    'imports: [PrismaModule]',
    'imports: [PrismaModule, NotificationModule]'
  );
  fs.writeFileSync('backend/src/hr/hr.module.ts', hrModule);
  console.log('✅ Updated hr.module.ts');
} else {
  console.log('ℹ️ NotificationModule already in hr.module.ts');
}

// ==========================================
// 6. Add NotificationModule to app.module.ts
// ==========================================
let appModule = fs.readFileSync('backend/src/app.module.ts', 'utf8');
if (!appModule.includes('NotificationModule')) {
  appModule = appModule.replace(
    "import { PosModule } from './pos/pos.module';",
    "import { PosModule } from './pos/pos.module';\nimport { NotificationModule } from './notification/notification.module';"
  );
  // Add to imports array
  appModule = appModule.replace(
    'PosModule,',
    'PosModule,\n    NotificationModule,'
  );
  fs.writeFileSync('backend/src/app.module.ts', appModule);
  console.log('✅ Updated app.module.ts');
} else {
  console.log('ℹ️ NotificationModule already in app.module.ts');
}

console.log('\n✅ All module files updated!');
