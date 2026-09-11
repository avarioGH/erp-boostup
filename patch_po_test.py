with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "order_number: 'PO-DUMMY', status: 'DRAFT', supplier_id: s_1, order_date: new Date()",
    "order_number: 'PO-DUMMY', status: 'DRAFT', supplier_id: s_1, order_date: new Date(), total_amount: 0"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
