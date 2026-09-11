with open("backend/src/notification/notification.listener.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("req.requested_by", "(req as any).requested_by")

with open("backend/src/notification/notification.listener.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/maintenance/maintenance.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("this.prisma.maintenanceLog.create", "(this.prisma as any).maintenanceLog.create")
c = c.replace("this.prisma.workOrder.update", "(this.prisma as any).workOrder.update")

with open("backend/src/maintenance/maintenance.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
