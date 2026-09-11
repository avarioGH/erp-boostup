with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Make sure p1 is defined globally
if "const p1 = new ObjectId().toHexString();" not in c:
    c = c.replace("const c1 = new ObjectId().toHexString();", "const c1 = new ObjectId().toHexString();\n  const p1 = new ObjectId().toHexString();")

c = c.replace(
    "await prisma.warehouse.create({ data: { id: w_1, company_id: c1, name: 'Main WH', type: 'INTERNAL' } });",
    "await prisma.warehouse.create({ data: { id: w_1, company_id: c1, name: 'Main WH', code: 'WH1' } as any });"
)
c = c.replace(
    "await prisma.product.create({ data: { id: p_1, company_id: c1, name: 'Test Product', sku: 'P-01', type: 'GOODS', purchase_price: 5000000, category_id: (await prisma.category.create({data:{company_id:c1, name:'Cat'}})).id } });",
    "await prisma.product.create({ data: { id: p1, company_id: c1, name: 'Test Product', code: 'P01', selling_price: 10000, purchase_price: 5000000, category_id: (await prisma.category.create({data:{company_id:c1, name:'Cat', type:'PRODUCT'} as any})).id } as any });"
)
c = c.replace(
    "await prisma.cashAccount.create({ data: { company_id: c1, account_id: cashAcc!.id, name: 'Main Cash', type: 'CASH', currency: 'IDR' } });",
    "await prisma.cashAccount.create({ data: { company_id: c1, chart_of_account_id: cashAcc!.id, name: 'Main Cash', type: 'CASH', currency: 'IDR' } as any });"
)

# And fix p_1 to p1
c = c.replace("p_1", "p1")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
