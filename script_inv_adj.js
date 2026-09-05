const fs = require('fs');
const file = 'backend/src/inventory/inventory.service.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('InventoryValuationEvent')) {
  code = "import { EventEmitter2 } from '@nestjs/event-emitter';\nimport { InventoryValuationEvent } from '../events/accounting.events';\n" + code;
  code = code.replace("constructor(private prisma: PrismaService) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}");
}

code = code.replace(
  "return tx.inventoryTransaction.update({\n        where: { id },\n        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }\n      });",
  "const updated = await tx.inventoryTransaction.update({\n        where: { id },\n        data: { status: 'Completed', approved_by: userId, approved_at: new Date() }\n      });\n      // Simple valuation logic for adjustments (assuming unit_cost exists, skipping if not)\n      let adjustmentValue = 0;\n      let type: 'ADJUSTMENT_LOSS' | 'ADJUSTMENT_GAIN' = 'ADJUSTMENT_LOSS';\n      for(const item of transaction.items) {\n         const diff = item.difference || 0;\n         if (diff !== 0) {\n            // Fallback to 0 if no unit_cost mapping.\n            const val = Math.abs(diff) * (item.unit_cost || 0);\n            adjustmentValue += val;\n            if (diff > 0) type = 'ADJUSTMENT_GAIN';\n            else type = 'ADJUSTMENT_LOSS';\n         }\n      }\n      if (adjustmentValue > 0) {\n         await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(companyId, id, 'EVT-' + Date.now(), new Date(), { type, totalValue: adjustmentValue }, tx as any));\n      }\n      return updated;"
);

fs.writeFileSync(file, code);
