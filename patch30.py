with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace(
    'const existingActiveBookings = await (this.prisma.manufacturingWorkOrder as any).findMany({\n      where: {\n        company_id,\n        status: { in: [\'PENDING\', \'READY\', \'IN_PROGRESS\'] },\n        started_at: { not: null },\n        completed_at: { not: null }\n      }',
    'const existingActiveBookings = await (this.prisma.manufacturingWorkOrder as any).findMany({\n      where: {\n        company_id,\n        status: { in: [\'PENDING\', \'READY\', \'IN_PROGRESS\'] },\n        planned_start: { not: null },\n        planned_end: { not: null }\n      }'
)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

