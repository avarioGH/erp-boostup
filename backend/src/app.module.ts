import { ReportsModule } from './reports/reports.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaModule } from './prisma/prisma.module';
import { AssetModule } from './asset/asset.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FinanceModule } from './finance/finance.module';
import { GlModule } from './gl/gl.module';
import { AccountingModule } from './accounting/accounting.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportingModule } from './reporting/reporting.module';
import { DocumentModule } from './document/document.module';
import { AutomationModule } from './automation/automation.module';
import { PlatformModule } from './platform/platform.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CrmModule } from './crm/crm.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { HrModule } from './hr/hr.module';
import { PosModule } from './pos/pos.module';
import { ShopeeModule } from './integrations/shopee/shopee.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AiModule } from './ai/ai.module';

import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ReportsModule,
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    InventoryModule, PrismaModule, AssetModule, MaintenanceModule, FinanceModule, GlModule, AccountingModule, AnalyticsModule, ReportingModule, DocumentModule, AutomationModule, PlatformModule, AuthModule, UsersModule, CrmModule,
    PurchasingModule, HrModule, PosModule, ShopeeModule, AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

