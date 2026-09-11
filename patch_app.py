with open("backend/src/app.module.ts", "r", encoding="utf-8") as f:
    c = f.read()

imports = """
import { ExpenseService } from './finance/expense/expense.service';
import { AssetService } from './finance/asset/asset.service';
import { ApprovalService } from './approval/approval.service';
import { ApprovalListener } from './approval/approval.listener';
"""

c = imports + c

c = c.replace(
    "providers: [",
    "providers: [\n    ExpenseService,\n    AssetService,\n    ApprovalService,\n    ApprovalListener,\n"
)

with open("backend/src/app.module.ts", "w", encoding="utf-8") as f:
    f.write(c)
