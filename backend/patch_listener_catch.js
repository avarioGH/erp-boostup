const fs = require('fs');
let code = fs.readFileSync('src/accounting/accounting.listener.ts', 'utf8');

code = code.replace(/async handleInventoryValuation\(event: InventoryValuationEvent\) {/, "async handleInventoryValuation(event: InventoryValuationEvent) {\n      try {");
code = code.replace(/    await this.glService.createJournalEntryWithinTx\(tx as any, \{\n      companyId: event.companyId,\n      entryDate: event.occurredAt,\n      referenceType: event.payload.type,\n      referenceId: event.sourceEntityId,\n      description: event.payload.description \|\| \`Inventory Valuation \(Event \$\{event.eventId\}\)\`,\n      items: \[\n        \{ accountId: debitAccount, debit: event.payload.totalValue, credit: 0 \},\n        \{ accountId: creditAccount, debit: 0, credit: event.payload.totalValue \},\n      \]\n    \}\);\n  \}/, "    await this.glService.createJournalEntryWithinTx(tx as any, {\n      companyId: event.companyId,\n      entryDate: event.occurredAt,\n      referenceType: event.payload.type,\n      referenceId: event.sourceEntityId,\n      description: event.payload.description || `Inventory Valuation (Event ${event.eventId})`,\n      items: [\n        { accountId: debitAccount, debit: event.payload.totalValue, credit: 0 },\n        { accountId: creditAccount, debit: 0, credit: event.payload.totalValue },\n      ]\n    });\n    } catch(e) { console.error('EVENT ERROR', e); throw e; }\n  }");

fs.writeFileSync('src/accounting/accounting.listener.ts', code, 'utf8');
console.log('patched event try catch');
