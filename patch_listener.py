def patch_listener(file):
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()

    old_pay = """const bankAccountGl = await this.resolveAccount(tx, event.companyId, ['1-1001', '1-1002', '1000', '1001'], ['Kas Utama', 'Bank', cashAccount.name]);"""
    new_pay = """const bankAccountGl = cashAccount.chart_of_account_id || await this.resolveAccount(tx, event.companyId, ['1-1001', '1-1002', '1000', '1001'], ['Kas Utama', 'Bank', cashAccount.name]);"""
    c = c.replace(old_pay, new_pay)

    old_payroll = """const cashAccount = await this.resolveAccount(tx, event.companyId, ['1-1001', '1000', '1-1002', '1001'], ['Kas Utama', 'Bank']);"""
    new_payroll = """const cashAccountEntity = await tx.cashAccount.findFirst({ where: { company_id: event.companyId } });
      const cashAccount = (cashAccountEntity && cashAccountEntity.chart_of_account_id) ? cashAccountEntity.chart_of_account_id : await this.resolveAccount(tx, event.companyId, ['1-1001', '1000', '1-1002', '1001'], ['Kas Utama', 'Bank']);"""
    c = c.replace(old_payroll, new_payroll)

    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

patch_listener("backend/src/accounting/accounting.listener.ts")
