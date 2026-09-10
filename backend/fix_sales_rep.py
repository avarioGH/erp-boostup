import re
with open('src/reports/services/sales-report.service.ts', 'r') as f:
    c = f.read()

c = c.replace("include: { items: { include: { stock_movement: true } } }", "include: { items: true }")

old_cogs = """        deliveries.forEach(del => {
          del.items.forEach(di => {
             if (di.stock_movement) cogs += di.stock_movement.total_cost;
          });
        });"""

new_cogs = """        for (const del of deliveries) {
          const movs = await this.prisma.stockMovement.findMany({ where: { transaction_id: del.id, movement_type: 'OUT' } });
          cogs += movs.reduce((sum, m) => sum + m.total_cost, 0);
        }"""

c = c.replace(old_cogs, new_cogs)

with open('src/reports/services/sales-report.service.ts', 'w') as f:
    f.write(c)

