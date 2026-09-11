with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'work_orders     ManufacturingWorkOrder[]\n  work_center_id String? @db.ObjectId',
    'work_orders     ManufacturingWorkOrder[]\n  capacity_hours_per_day Float?\n  efficiency_percentage Float?\n  shift_start_time String?\n  shift_end_time String?\n  work_center_id String? @db.ObjectId'
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/manufacturing/quality/quality.service.ts", "r", encoding="utf-8") as f:
    qc = f.read()
qc = qc.replace("const disp = await (tx as any).qualityDisposition.create({", "const disp = await (tx as any)['qualityDisposition'].create({")

with open("backend/src/manufacturing/quality/quality.service.ts", "w", encoding="utf-8") as f:
    f.write(qc)

