approval_module = """
import { Module } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalListener } from './approval.listener';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApprovalService, ApprovalListener],
  exports: [ApprovalService],
})
export class ApprovalModule {}
"""
with open("backend/src/approval/approval.module.ts", "w", encoding="utf-8") as f:
    f.write(approval_module)

with open("backend/src/app.module.ts", "r", encoding="utf-8") as f:
    c = f.read()
if "ApprovalModule" not in c:
    c = c.replace(
        "import { RoleModule }",
        "import { ApprovalModule } from './approval/approval.module';\nimport { RoleModule }"
    )
    c = c.replace(
        "imports: [\n",
        "imports: [\n    ApprovalModule,\n"
    )
    with open("backend/src/app.module.ts", "w", encoding="utf-8") as f:
        f.write(c)

with open("backend/src/finance/finance.module.ts", "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace(
    "import { FinanceService }",
    "import { ExpenseService } from './expense/expense.service';\nimport { AssetService } from './asset/asset.service';\nimport { FinanceService }"
)
text = text.replace(
    "providers: [FinanceService,",
    "providers: [ExpenseService, AssetService, FinanceService,"
)
with open("backend/src/finance/finance.module.ts", "w", encoding="utf-8") as f:
    f.write(text)

