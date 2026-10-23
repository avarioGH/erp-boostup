import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { MemoryCacheService } from '../common/memory-cache.service';

@Global()
@Module({
  providers: [
    AuditService,
    MemoryCacheService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [AuditService, MemoryCacheService],
})
export class CoreModule {}

