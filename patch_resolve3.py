def patch_resolve(file):
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()

    old_func = """    const newAcc = await tx.chartOfAccount.create({
      data: {
        company_id: companyId,
        account_code: codes[0],
        account_name: names[0],
        account_type_id: act.id,
        current_balance: 0
      }
    });"""

    new_func = """    const newAcc = await tx.chartOfAccount.create({
      data: {
        company_id: companyId,
        account_code: codes[0],
        account_name: names[0],
        account_type_id: act.id
      }
    });"""

    if old_func in c:
        c = c.replace(old_func, new_func)
    else:
        print("COULD NOT FIND!")

    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

patch_resolve("backend/src/accounting/accounting.listener.ts")
