const fs = require('fs');
let code = fs.readFileSync('backend/src/accounting/accounting.listener.ts', 'utf8');

// Add import
code = code.replace(
  /InventoryValuationEvent\s*\n\s*\}/,
  "InventoryValuationEvent,\n  ExpensePostedEvent\n}"
);

// Add event listener
const listenerCode = \
  @OnEvent('expense.posted', { async: false })
  async handleExpensePosted(event: ExpensePostedEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, 'EXPENSE', event.sourceEntityId)) return;

    const expenseAccount = await this.resolveAccount(tx, event.companyId, ['6-2001', '6001'], ['Beban Operasional', 'Operational Expense']);
    const liabilityAccount = await this.resolveAccount(tx, event.companyId, ['2-1300', '2300'], ['Hutang Karyawan', 'Employee Payable']);

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'EXPENSE',
      referenceId: event.sourceEntityId,
      description: \Employee Expense Posted (Event \)\,
      items: [
        { accountId: expenseAccount, debit: event.payload.totalAmount, credit: 0 },
        { accountId: liabilityAccount, debit: 0, credit: event.payload.totalAmount },
      ]
    });
  }
\;

code = code.replace(/export class AccountingListener \{/, "export class AccountingListener {\n" + listenerCode);

fs.writeFileSync('backend/src/accounting/accounting.listener.ts', code, 'utf8');
