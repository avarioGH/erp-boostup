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
