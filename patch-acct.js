const fs = require('fs');
let file = 'backend/src/accounting/accounting.listener.ts';
let content = fs.readFileSync(file, 'utf8');

const oldGl = `    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'POS',
      referenceId: event.sourceEntityId,
      description: \`Penjualan POS (Event \${event.eventId})\`,
      items: [
        {
          accountId: debitAccountId,
          debit: event.payload.totalAmount,
          credit: 0,
        },
        {
          accountId: creditAccountId,
          debit: 0,
          credit: event.payload.totalAmount,
        },
      ],
    });`;

const newGl = `    const items = [];
    
    // Piutang account for any unpaid balance
    const arAccountId = await this.resolveAccount(
      tx,
      event.companyId,
      ['1-1004', '1102', 'Piutang'],
      ['Piutang Usaha', 'Accounts Receivable'],
      'AUTO-AR',
      'Debit'
    );

    const paidAmount = event.payload.paidAmount !== undefined ? event.payload.paidAmount : event.payload.totalAmount;
    const unpaidAmount = event.payload.totalAmount - paidAmount;

    if (paidAmount > 0) {
      items.push({
        accountId: debitAccountId,
        debit: paidAmount,
        credit: 0,
      });
    }

    if (unpaidAmount > 0) {
      items.push({
        accountId: arAccountId,
        debit: unpaidAmount,
        credit: 0,
      });
    }

    items.push({
      accountId: creditAccountId,
      debit: 0,
      credit: event.payload.totalAmount,
    });

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'POS',
      referenceId: event.sourceEntityId,
      description: \`Penjualan POS (Event \${event.eventId})\`,
      items: items,
    });`;

content = content.replace(oldGl, newGl);
fs.writeFileSync(file, content);
console.log('Patched accounting listener for split payment');
