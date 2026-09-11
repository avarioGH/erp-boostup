with open("backend/src/app.module.ts", "r", encoding="utf-8") as f:
    c = f.read()

if "import { ApprovalModule }" not in c:
    c = "import { ApprovalModule } from './approval/approval.module';\n" + c

with open("backend/src/app.module.ts", "w", encoding="utf-8") as f:
    f.write(c)

