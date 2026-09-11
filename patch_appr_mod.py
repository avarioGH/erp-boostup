approval_module = """
import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalDomainListener } from './approval.listener';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApprovalService, ApprovalDomainListener],
  exports: [ApprovalService],
})
export class ApprovalModule {}
"""
with open("backend/src/approval/approval.module.ts", "w", encoding="utf-8") as f:
    f.write(approval_module)

