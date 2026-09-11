with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

old_code = """      await verify('APPROVAL', 'AP1-AP14 - Approval Engine', async () => {
        const req = await approvalService.requestApproval(c1, uAdminId, {
          module: 'TEST_MODULE', referenceId: 'REF-123', title: 'Test Approval'
        });
        assert(req.status === 'PENDING', 'Approval requested');
        const apprv = await approvalService.approve(c1, uAdminId, req.id);
        assert(apprv.status === 'APPROVED', 'Approval granted');
      });"""

new_code = """      await verify('APPROVAL', 'AP1-AP14 - Approval Engine', async () => {
        const dummyPo = await prisma.purchaseOrder.create({ data: { company_id: c1, order_number: 'PO-DUMMY', status: 'DRAFT', supplier_id: s_1, order_date: new Date() } as any });
        const req = await approvalService.requestApproval(c1, uAdminId, {
          module: 'PURCHASE_ORDER', referenceId: dummyPo.id, title: 'Test Approval'
        });
        assert(req.status === 'PENDING', 'Approval requested');
        // Because of the self-approval fix we must mock the ApprovalLog if needed, but since requestApproval runs first, it logs REQUESTED.
        // But uAdminId is the requester, so uAdminId CANNOT approve! We need a different user to approve it!
        const uApproverId = new ObjectId().toHexString();
        await prisma.user.create({ data: { id: uApproverId, email: 'appr@e.com', password_hash: 'x', first_name: 'A', last_name: 'B', role_id: roleAdminId } as any });
        const apprv = await approvalService.approve(c1, uApproverId, req.id);
        assert(apprv.status === 'APPROVED', 'Approval granted');
      });"""

c = c.replace(old_code, new_code)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
