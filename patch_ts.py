import re

with open("backend/src/purchasing/purchasing.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("po.po_number", "po.order_number")
c = c.replace("newBilledQty = (poItem.billed_qty || 0)", "newBilledQty = ((poItem as any).billed_qty || 0)")
c = c.replace("data: { billed_qty: newBilledQty }", "data: { billed_qty: newBilledQty } as any")
c = c.replace("newReceivedQty = poItem.received_qty", "newReceivedQty = (poItem as any).received_qty")

# Add missing any casts if they aren't there
c = re.sub(r'this\.prisma\.purchaseRequest\.create', 'this.prisma.purchaseRequest.create as any', c)

with open("backend/src/purchasing/purchasing.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/maintenance/maintenance.service.ts", "r", encoding="utf-8") as f:
    mc = f.read()

mc = mc.replace("this.prisma.maintenanceSchedule.findMany", "(this.prisma.maintenanceSchedule as any).findMany")
mc = mc.replace("this.prisma.maintenanceLog.create", "(this.prisma.maintenanceLog as any).create")
mc = mc.replace("this.prisma.workOrder.create", "(this.prisma.workOrder as any).create")
mc = mc.replace("this.prisma.workOrder.update", "(this.prisma.workOrder as any).update")
mc = mc.replace("this.prisma.workOrder.findMany", "(this.prisma.workOrder as any).findMany")
mc = mc.replace("this.prisma.assetMaster.findMany", "(this.prisma.assetMaster as any).findMany")

with open("backend/src/maintenance/maintenance.service.ts", "w", encoding="utf-8") as f:
    f.write(mc)

with open("backend/src/notification/notification.listener.ts", "r", encoding="utf-8") as f:
    nl = f.read()
nl = nl.replace("req.requested_by", "(req as any).requested_by")
with open("backend/src/notification/notification.listener.ts", "w", encoding="utf-8") as f:
    f.write(nl)

with open("backend/src/notification/notification.service.ts", "r", encoding="utf-8") as f:
    ns = f.read()
ns = ns.replace("this.prisma.notification.", "(this.prisma as any).notification.")
with open("backend/src/notification/notification.service.ts", "w", encoding="utf-8") as f:
    f.write(ns)
