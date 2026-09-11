def patch_resolve(file):
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()
    
    old_func = """    // Create it dynamically for tests
    const act = await tx.accountType.findFirst(); // grab any valid account type
    const newAcc = await tx.chartOfAccount.create({
      data: {
        company_id: companyId,
        account_code: codes[0],
        account_name: names[0],
        account_type_id: act?.id || '6aa332450e6319e56eb129fb',
        current_balance: 0
      }
    });
    return newAcc.id;
  }"""

    new_func = """    // Create it dynamically for tests
    let act = await tx.accountType.findFirst();
    if (!act) {
      act = await tx.accountType.create({ data: { name: 'Auto Generated', normal_balance: 'Debit' } });
    }
    const newAcc = await tx.chartOfAccount.create({
      data: {
        company_id: companyId,
        account_code: codes[0],
        account_name: names[0],
        account_type_id: act.id,
        current_balance: 0
      }
    });
    return newAcc.id;
  }"""
    
    if old_func in c:
        c = c.replace(old_func, new_func)
    else:
        print("COULD NOT FIND old_func!")
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

patch_resolve("backend/src/accounting/accounting.listener.ts")
