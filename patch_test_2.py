import re

with open("backend/src/approval/approval.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("reqLog.acted_by === userId", "reqLog.acted_by === actor")
with open("backend/src/approval/approval.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/purchasing/purchasing.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace(
    "constructor(private prisma: PrismaService, private inventoryService: InventoryService) {}",
    "constructor(private prisma: PrismaService, private inventoryService: InventoryService, private eventEmitter: EventEmitter2) {}"
)
if "import { EventEmitter2 } from" not in c:
    c = "import { EventEmitter2 } from '@nestjs/event-emitter';\n" + c
with open("backend/src/purchasing/purchasing.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("const p1 = new ObjectId().toHexString();", "", 1) # remove second redeclaration
c = c.replace("type: 'INTERNAL'", "")
c = c.replace("sku: 'P-01', type: 'GOODS', ", "")
c = c.replace("const invAcc = await gl.getAccount", "const invAcc = await prisma.chartOfAccount.findFirst")
c = c.replace("const apAcc = await gl.getAccount", "const apAcc = await prisma.chartOfAccount.findFirst")
c = c.replace("const expAcc = await gl.getAccount", "const expAcc = await prisma.chartOfAccount.findFirst")
c = c.replace("const cashAcc = await gl.getAccount", "const cashAcc = await prisma.chartOfAccount.findFirst")
c = c.replace("account_id: cashAcc.id", "gl_account_id: cashAcc ? cashAcc.id : new ObjectId().toHexString()")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

