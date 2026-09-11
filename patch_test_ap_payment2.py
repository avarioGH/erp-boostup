with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

old = """  await verify('PURCHASING', 'P44-P53 - AP Payment', async () => {
    const pay = await purchasingService.payVendorBill(c1, vendorBillId, {
      amount: 50000000, method: 'BANK_TRANSFER', accountId: cashAccountEntity.id
    });
    assert(pay !== null, 'Payment recorded');
  });"""

new = """  await verify('PURCHASING', 'P44-P53 - AP Payment', async () => {
    const oldCash = await prisma.cashAccount.findUnique({ where: { id: cashAccountEntity.id } });
    const pay = await purchasingService.payVendorBill(c1, vendorBillId, {
      amount: 50000000, method: 'BANK_TRANSFER', accountId: cashAccountEntity.id
    });
    assert(pay !== null, 'Payment recorded');
    await new Promise(r => setTimeout(r, 100)); // wait for event
    const newCash = await prisma.cashAccount.findUnique({ where: { id: cashAccountEntity.id } });
    assert(newCash!.current_balance < oldCash!.current_balance, 'Cash decreased after AP payment');
  });"""

c = c.replace(old, new)
with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
