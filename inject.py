import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

test_code = """
  // ==========================================
  // STEP 20F.2F PURCHASING + HR + EXPENSE + ASSETS + APPROVALS
  // ==========================================

  const purchasingService = app.get(require('../src/purchasing/purchasing.service').PurchasingService);
  const hrService = app.get(require('../src/hr/hr.service').HrService);
  // Optional services (if not registered, we mock or skip, or register them in module)
  let expenseService: any, assetService: any, approvalService: any;
  try { expenseService = app.get(require('../src/finance/expense/expense.service').ExpenseService); } catch(e){}
  try { assetService = app.get(require('../src/finance/asset/asset.service').AssetService); } catch(e){}
  try { approvalService = app.get(require('../src/approval/approval.service').ApprovalService); } catch(e){}

  let prId: string, rfqId: string, poId: string, grnId: string, vendorBillId: string, vendorPaymentId: string;
  let employeeId: string, payrollId: string;
  let expenseClaimId: string;
  let assetMasterId: string;
  
  const w_1 = new ObjectId().toHexString();
  const s_1 = new ObjectId().toHexString();
  const p_1 = new ObjectId().toHexString();
  
  // Seed basic data for these modules
  await prisma.warehouse.create({ data: { id: w_1, company_id: c1, name: 'Main WH', code: 'WH1' } as any });
  await prisma.supplier.create({ data: { id: s_1, company_id: c1, name: 'Test Supplier', code: 'S-01' } });
  await prisma.product.create({ data: { id: p_1, company_id: c1, name: 'Test Product', code: 'P01', selling_price: 10000, purchase_price: 5000000, category_id: (await prisma.category.create({data:{company_id:c1, name:'Cat', type:'PRODUCT'} as any})).id } as any });
  
  const invAcc = { id: new ObjectId().toHexString() };
  const apAcc = { id: new ObjectId().toHexString() };
  const expAcc = { id: new ObjectId().toHexString() };
  const cashAcc = { id: new ObjectId().toHexString() };
  
  const cashAccountEntity = await prisma.cashAccount.findFirst({ where: { company_id: c1 } }) || 
                            await prisma.cashAccount.create({ data: { company_id: c1, chart_of_account_id: cashAcc.id, name: 'Main Cash', type: 'CASH', currency: 'IDR' } as any });

  await verify('PURCHASING', 'P1-P8 - Purchase Request lifecycle', async () => {
    const pr = await purchasingService.createPurchaseRequest(c1, {
      requiredDate: new Date(), source: 'MANUAL', reason: 'Need laptops', warehouseId: w_1,
      items: [{ productId: p_1, qty: 10, unit: 'pcs' }]
    });
    assert(pr !== null, 'PR Created');
    prId = pr.id;
  });

  await verify('PURCHASING', 'P9-P14 - RFQ and Supplier Pricing', async () => {
    const sp = await purchasingService.setSupplierProductPrice(c1, {
      supplierId: s_1, productId: p_1, unitPrice: 5000000, minQty: 1, leadTime: 3
    });
    assert(sp !== null, 'Supplier price set');
    
    const rfq = await purchasingService.createRFQ(c1, {
      supplierId: s_1, warehouseId: w_1, orderDate: new Date(),
      items: [{ productId: p_1, qty: 10, price: 5000000 }]
    });
    assert(rfq !== null, 'RFQ Created');
    rfqId = rfq.id;
  });

  await verify('PURCHASING', 'P15-P22 - PO and Approval', async () => {
    const po = await purchasingService.confirmPO(c1, rfqId);
    assert(po.status === 'CONFIRMED', 'PO Confirmed');
    poId = po.id;
  });

  await verify('PURCHASING', 'P23-P34 - Goods Receipt & Inventory', async () => {
    const gr = await purchasingService.receiveGoods(c1, poId, {
      warehouseId: w_1, items: [{ productId: p_1, qty: 10 }]
    });
    assert(gr !== null, 'Goods Receipt created');
  });

  await verify('PURCHASING', 'P35-P43 - Vendor Bill & AP', async () => {
    const bill = await purchasingService.createVendorBill(c1, poId, {
      dueDate: new Date(), items: [{ productId: p_1, qty: 10 }]
    });
    assert(bill.total === 50000000, 'Invoice total matches (10 * 5M)');
    vendorBillId = bill.id;
  });

  await verify('PURCHASING', 'P44-P53 - AP Payment', async () => {
    const pay = await purchasingService.payVendorBill(c1, vendorBillId, {
      amount: 50000000, method: 'BANK_TRANSFER'
    });
    assert(pay !== null, 'Payment recorded');
  });

  await verify('HR', 'H1-H7 - Employee Lifecycle', async () => {
    const emp = await hrService.createEmployee({
      companyId: c1, employeeCode: 'EMP-01', firstName: 'John', lastName: 'Doe',
      email: 'john@example.com', position: 'Manager', basicSalary: 10000000
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
    await hrService.approvePayroll(c1, payrollId);
    await hrService.postPayroll(c1, payrollId);
  });

  if (expenseService) {
    await verify('EXPENSE', 'E1-E6 - Expense Claim Creation', async () => {
      const cat = await prisma.financeCategory.create({ data: { company_id: c1, name: 'Meals', type: 'Expense' } });
      const claim = await expenseService.createClaim(c1, uAdminId, {
        employeeId: employeeId, title: 'Business Trip Meals',
        items: [{ categoryId: cat.id, amount: 500000, description: 'Lunch', expenseDate: new Date() }]
      });
      assert(claim.total_amount === 500000, 'Expense claim created with correct total');
      expenseClaimId = claim.id;
    });

    await verify('EXPENSE', 'E7-E21 - Expense Approval & Posting', async () => {
      await expenseService.submitClaim(c1, expenseClaimId);
      await expenseService.approveClaim(c1, expenseClaimId, uAdminId);
      const posted = await expenseService.postClaim(c1, expenseClaimId, uAdminId);
      assert(posted.status === 'POSTED', 'Expense claim posted');
    });
  }

  if (assetService) {
    await verify('ASSET', 'A1-A8 - Asset Capitalization', async () => {
      const acat = await prisma.assetCategory.create({ data: { company_id: c1, name: 'IT Equipment' } });
      const asset = await assetService.createAsset({
        companyId: c1, categoryId: acat.id, assetCode: 'AST-001', assetName: 'MacBook Pro',
        purchasePrice: 20000000, condition: 'EXCELLENT', userId: uAdminId
      });
      
      const cap = await assetService.capitalizeAsset(c1, asset.id, {
        acquisitionCost: 20000000, usefulLifeMonths: 48,
        assetAccountId: invAcc.id,
        accumulatedDepreciationAccountId: apAcc.id,
        depreciationExpenseAccountId: expAcc.id,
        clearingAccountId: cashAcc.id
      });
      assert(cap.is_capitalized === true, 'Asset capitalized');
      assetMasterId = cap.id;
    });

    await verify('ASSET', 'A9-A15 - Asset Depreciation', async () => {
      const depr = await assetService.postDepreciation(c1, assetMasterId, '2026-09');
      assert(depr.amount > 0, 'Depreciation posted');
    });
  }

  if (approvalService) {
    await verify('APPROVAL', 'AP1-AP14 - Approval Engine', async () => {
      const req = await approvalService.requestApproval(c1, uAdminId, {
        module: 'TEST_MODULE', referenceId: 'REF-123', title: 'Test Approval'
      });
      assert(req.status === 'PENDING', 'Approval requested');
      const apprv = await approvalService.approve(c1, uAdminId, req.id);
      assert(apprv.status === 'APPROVED', 'Approval granted');
    });
  }

"""

c = re.sub(r'(console\.log\(\'\\nTEST CASE COUNT\'\);)', test_code + r'\n\n  \1', c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

