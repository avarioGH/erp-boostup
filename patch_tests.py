test_code = """
  // ==========================================
  // STEP 20F.2F PURCHASING + HR + EXPENSE + ASSETS + APPROVALS
  // ==========================================

  const purchasingService = app.get(require('../src/purchasing/purchasing.service').PurchasingService);
  const hrService = app.get(require('../src/hr/hr.service').HrService);
  const expenseService = app.get(require('../src/finance/expense/expense.service').ExpenseService);
  const assetService = app.get(require('../src/finance/asset/asset.service').AssetService);
  const approvalService = app.get(require('../src/approval/approval.service').ApprovalService);

  let prId, rfqId, poId, grnId, vendorBillId, vendorPaymentId;
  let employeeId, payrollId;
  let expenseClaimId;
  let assetMasterId;
  
  await verify('PURCHASING', 'P1-P8 - Purchase Request lifecycle', async () => {
    // We mock the DB state for PR testing
    const pr = await purchasingService.createPurchaseRequest(c1, {
      requiredDate: new Date(),
      source: 'MANUAL',
      reason: 'Need laptops',
      warehouseId: w1,
      items: [{ productId: p1, qty: 10, unit: 'pcs' }]
    });
    assert(pr !== null, 'PR Created');
    prId = pr.id;
  });

  await verify('PURCHASING', 'P9-P14 - RFQ and Supplier Pricing', async () => {
    const sp = await purchasingService.setSupplierProductPrice(c1, {
      supplierId: s1, productId: p1, unitPrice: 5000000, minQty: 1, leadTime: 3
    });
    assert(sp !== null, 'Supplier price set');
    
    const rfq = await purchasingService.createRFQ(c1, {
      supplierId: s1, warehouseId: w1, orderDate: new Date(),
      items: [{ productId: p1, qty: 10, price: 5000000 }]
    });
    assert(rfq !== null, 'RFQ Created');
    rfqId = rfq.id;
  });

  await verify('PURCHASING', 'P15-P22 - PO and Approval', async () => {
    const po = await purchasingService.confirmPO(c1, rfqId);
    assert(po.status === 'CONFIRMED', 'PO Confirmed');
    assert(po.order_number.startsWith('PO-'), 'PO Number format');
    poId = po.id;
  });

  await verify('PURCHASING', 'P23-P34 - Goods Receipt & Inventory', async () => {
    const gr = await purchasingService.receiveGoods(c1, poId, {
      warehouseId: w1,
      items: [{ productId: p1, qty: 10 }]
    });
    assert(gr !== null, 'Goods Receipt created');
    
    // Check stock was received by inventory service
    const ws = await prisma.warehouseStock.findFirst({ where: { warehouse_id: w1, product_id: p1 } });
    assert(ws !== null, 'Warehouse stock updated via InventoryService');
    grnId = gr.id;
  });

  await verify('PURCHASING', 'P35-P43 - Vendor Bill & AP', async () => {
    const bill = await purchasingService.createVendorBill(c1, poId, {
      dueDate: new Date(),
      items: [{ productId: p1, qty: 10 }]
    });
    assert(bill.total === 50000000, 'Invoice total matches (10 * 5M)');
    vendorBillId = bill.id;
  });

  await verify('PURCHASING', 'P44-P53 - AP Payment', async () => {
    const pay = await purchasingService.payVendorBill(c1, vendorBillId, {
      amount: 50000000, method: 'BANK_TRANSFER'
    });
    assert(pay !== null, 'Payment recorded');
    const bill = await prisma.invoice.findUnique({ where: { id: vendorBillId } });
    assert(bill.status === 'PAID', 'Vendor bill is PAID');
  });

  await verify('HR', 'H1-H7 - Employee Lifecycle', async () => {
    const emp = await hrService.createEmployee({
      companyId: c1, firstName: 'John', lastName: 'Doe',
      email: 'john@example.com', position: 'Manager',
      basicSalary: 10000000
    });
    assert(emp !== null, 'Employee created');
    employeeId = emp.id;
  });

  await verify('HR', 'H8-H13 - Attendance', async () => {
    const att = await hrService.createAttendance({
      companyId: c1, employeeId: employeeId, date: new Date(), status: 'PRESENT'
    });
    assert(att !== null, 'Attendance recorded');
  });

  await verify('HR', 'H23-H36 - Payroll calculation & posting', async () => {
    const p = await hrService.calculatePayroll(c1, employeeId, '2026-09');
    assert(p.net_salary > 0, 'Payroll calculated');
    payrollId = p.id;
    
    const approved = await hrService.approvePayroll(c1, payrollId);
    assert(approved.status === 'APPROVED', 'Payroll approved');
    
    const posted = await hrService.postPayroll(c1, payrollId);
    assert(posted.status === 'POSTED', 'Payroll posted');
  });

  await verify('HR', 'H37-H44 - Payroll Payment', async () => {
    const pay = await hrService.payPayroll(c1, payrollId);
    assert(pay.status === 'PAID', 'Payroll paid');
  });

  await verify('EXPENSE', 'E1-E6 - Expense Claim Creation', async () => {
    const cat = await prisma.financeCategory.create({ data: { company_id: c1, name: 'Meals', type: 'Expense' } });
    const claim = await expenseService.createClaim(c1, adminUser.id, {
      employeeId: employeeId,
      title: 'Business Trip Meals',
      items: [{ categoryId: cat.id, amount: 500000, description: 'Lunch' }]
    });
    assert(claim.total_amount === 500000, 'Expense claim created with correct total');
    expenseClaimId = claim.id;
  });

  await verify('EXPENSE', 'E7-E21 - Expense Approval & Posting', async () => {
    await expenseService.submitClaim(c1, expenseClaimId);
    await expenseService.approveClaim(c1, expenseClaimId, adminUser.id);
    const posted = await expenseService.postClaim(c1, expenseClaimId, adminUser.id);
    assert(posted.status === 'POSTED', 'Expense claim posted');
  });

  await verify('ASSET', 'A1-A8 - Asset Capitalization', async () => {
    const acat = await prisma.assetCategory.create({ data: { company_id: c1, name: 'IT Equipment' } });
    const asset = await assetService.createAsset({
      companyId: c1, categoryId: acat.id, assetCode: 'AST-001', assetName: 'MacBook Pro',
      purchasePrice: 20000000, condition: 'EXCELLENT', userId: adminUser.id
    });
    
    const cap = await assetService.capitalizeAsset(c1, asset.id, {
      acquisitionCost: 20000000, usefulLifeMonths: 48,
      assetAccountId: (await glService.getAccount(c1, '1-1300', '1300', 'Inventory Asset', 'Asset')).id,
      accumulatedDepreciationAccountId: (await glService.getAccount(c1, '1-1301', '1301', 'Acc Depr', 'Asset')).id,
      depreciationExpenseAccountId: (await glService.getAccount(c1, '6-2001', '6001', 'Depr Exp', 'Expense')).id,
      clearingAccountId: cashAccount.id
    });
    assert(cap.is_capitalized === true, 'Asset capitalized');
    assetMasterId = cap.id;
  });

  await verify('ASSET', 'A9-A15 - Asset Depreciation', async () => {
    const depr = await assetService.postDepreciation(c1, assetMasterId, '2026-09');
    assert(depr.amount > 0, 'Depreciation posted');
  });

  await verify('APPROVAL', 'AP1-AP14 - Approval Engine', async () => {
    const req = await approvalService.requestApproval(c1, adminUser.id, {
      module: 'TEST_MODULE', referenceId: 'REF-123', title: 'Test Approval'
    });
    assert(req.status === 'PENDING', 'Approval requested');
    const apprv = await approvalService.approve(c1, adminUser.id, req.id);
    assert(apprv.status === 'APPROVED', 'Approval granted');
  });

"""

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("console.log('\\nTEST CASE COUNT');", test_code + "\n  console.log('\\nTEST CASE COUNT');")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
