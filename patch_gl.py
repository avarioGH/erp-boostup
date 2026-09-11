with open('backend/src/gl/gl.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Accounting Period ambiguity
c = c.replace("""const period = await tx.accountingPeriod.findFirst({
      where: {
        company_id: data.companyId,
        start_date: { lte: data.entryDate },
        end_date: { gte: data.entryDate }
      }
    });""", """const period = await tx.accountingPeriod.findFirst({
      where: {
        company_id: data.companyId,
        start_date: { lte: data.entryDate },
        end_date: { gte: data.entryDate }
      },
      orderBy: { status: 'asc' } // 'CLOSED' and 'LOCKED' sort before 'OPEN' alphabetically, so specific closed periods override broad open ones. Or ideally by created_at desc.
    });""")
c = c.replace("orderBy: { status: 'asc' }", "orderBy: { created_at: 'desc' }") # Better: newest overrides older broad period

# Fix 0-value and negative journals
c = c.replace("if (totalDebit !== totalCredit) {", """if (totalDebit <= 0 || totalCredit <= 0) {
      throw new Error(`Journal Entry cannot have zero or negative value. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    const hasNegative = data.items.some(item => item.debit < 0 || item.credit < 0);
    if (hasNegative) {
      throw new Error(`Journal Entry lines cannot be negative.`);
    }

    if (totalDebit !== totalCredit) {""")

with open('backend/src/gl/gl.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
