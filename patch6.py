import re
with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("can_be_sold: false, can_be_purchased: true, product_type: 'STOCKABLE', price: 10, cost: 10", "purchase_price: 10, selling_price: 10")
c = c.replace("can_be_sold: false, can_be_purchased: true, product_type: 'STOCKABLE', price: 15, cost: 15", "purchase_price: 15, selling_price: 15")
c = c.replace("can_be_sold: true, can_be_purchased: false, product_type: 'STOCKABLE', price: 100, cost: 0", "purchase_price: 0, selling_price: 100")
c = c.replace("reference_id: moId", "transaction_id: moId")
c = c.replace("movement_id: movs[0].id", "stock_movement_id: movs[0].id")
c = c.replace("const lines = await prisma.journalEntryLine.findMany({ where: { journal_entry_id: je.id } });", "const lines = await prisma.journalEntryItem.findMany({ where: { journal_entry_id: je.id } });")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

