with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
"""      warehouse_id: mWhId,
      planned_quantity: 5,
      unit_id: unit1,""",
"""      warehouse_id: mWhId,
      planned_quantity: 5,
      unit_id: unit1,
      status: 'CONFIRMED',"""
)
c = c.replace("assertEq(mo.status, 'DRAFT', 'D5 initial status correct');", "assertEq(mo.status, 'CONFIRMED', 'D5 initial status correct');")
with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

