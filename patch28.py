import re
with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace(
    'const maintenanceBlackouts = await (this.prisma.workOrder as any).findMany({',
    'const maintenanceBlackouts = await (this.prisma.workOrder as any).findMany({\n      ...( {} as any ),'
)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

