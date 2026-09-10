with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("const cat = await prisma.category.create", "const unit = await prisma.unit.create({ data: { company_id: companyId, code: 'PCS', name: 'PCS' } });\n  const cat = await prisma.category.create")
c = c.replace("category_id: cat.id,", "category_id: cat.id, unit_id: unit.id, purchase_price: 100, selling_price: 150,")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

