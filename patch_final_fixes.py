with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "is_capitalized: false",
    "is_capitalized: false, status: 'ACTIVE'"
)

c = c.replace(
    "const req = await approvalService.requestApproval(c1, uAdminId, {",
    "const dummyPo = await prisma.purchaseOrder.create({ data: { company_id: c1, order_number: 'PO-DUMMY', status: 'DRAFT', supplier_id: s_1, order_date: new Date() } as any });\n      const req = await approvalService.requestApproval(c1, uAdminId, {"
)

c = c.replace(
    "module: 'TEST_MODULE', referenceId: 'REF-123'",
    "module: 'PURCHASE_ORDER', referenceId: dummyPo.id"
)

c = c.replace(
    "const apprv = await approvalService.approve(c1, uAdminId, req.id);",
    "const uApproverId = new ObjectId().toHexString();\n      await prisma.user.create({ data: { id: uApproverId, email: 'a@b.com', password_hash: 'x', first_name: 'A', last_name: 'B' } as any });\n      const apprv = await approvalService.approve(c1, uApproverId, req.id);"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
