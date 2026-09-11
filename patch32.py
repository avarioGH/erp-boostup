with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

old_str = """    const maintenanceBlackouts = await (this.prisma.workOrder as any).findMany({
      ...( {} as any ),
      where: {
        company_id,
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        planned_start: { not: null },
        planned_end: { not: null },
        asset: { work_center_id: { not: null } }
      },
      include: { asset: true }
    });

    for (const b of maintenanceBlackouts) {
      if (b.asset && b.asset.work_center_id && wcBookings.has(b.asset.work_center_id)) {
        wcBookings.get(b.asset.work_center_id).push({
          started_at: new Date(b.planned_start!),
          completed_at: new Date(b.planned_end!)
        });"""

new_str = old_str.replace("planned_start", "started_at").replace("planned_end", "completed_at")

sc = sc.replace(old_str, new_str)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

