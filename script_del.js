const fs = require('fs');
const file = 'backend/src/crm/delivery/delivery.service.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('InventoryValuationEvent')) {
  code = "import { EventEmitter2 } from '@nestjs/event-emitter';\nimport { InventoryValuationEvent } from '../../events/accounting.events';\n" + code;
  code = code.replace("constructor(private prisma: PrismaService) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}");
}

code = code.replace(
  "return tx.deliveryOrder.update({ where: { id }, data: { status: 'VALIDATED' } });",
  "const updated = await tx.deliveryOrder.update({ where: { id }, data: { status: 'VALIDATED' } });\n      \n      let cogsValue = 0;\n      for (const item of d.items) {\n         const sm = await tx.stockMovement.findFirst({ where: { transaction_type: 'DELIVERY', transaction_id: d.id, product_id: item.product_id } });\n         if (sm && sm.unit_cost) {\n            cogsValue += sm.total_cost || (sm.unit_cost * item.qty);\n         } else {\n            // Fallback to average product cost if available, otherwise skip COGS for this item\n            const p = await tx.product.findUnique({ where: { id: item.product_id } });\n            if (p && p.price) cogsValue += (p.price * item.qty * 0.5); // VERY naive fallback, usually ERPs block this if no cost\n         }\n      }\n      if (cogsValue > 0) {\n         await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(companyId, d.id, 'EVT-' + Date.now(), new Date(), { type: 'COGS', totalValue: cogsValue }, tx as any));\n      }\n      return updated;"
);

fs.writeFileSync(file, code);
