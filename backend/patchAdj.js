const fs = require('fs');
let sa = fs.readFileSync('src/inventory/stock-adjustment.service.ts', 'utf8');

// Add audit after createAdjustment - before "return adjustment;\n    });\n  }\n\n  async postAdjustment"
sa = sa.replace(
  '      return adjustment;\n    });\n  }\n\n  async postAdjustment',
  "      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'STOCK_ADJUSTMENT', entity_id: adjustment.id, after_data: { status: adjustment.status } } });\n      return adjustment;\n    });\n  }\n\n  async postAdjustment"
);

// Add audit after postAdjustment - before "return adjustment;\n    });\n  }\n\n  async cancelAdjustment"
sa = sa.replace(
  '      return adjustment;\n    });\n  }\n\n  async cancelAdjustment',
  "      await tx.auditLog.create({ data: { action: 'POST', entity: 'STOCK_ADJUSTMENT', entity_id: id, before_data: { status: 'DRAFT' }, after_data: { status: 'POSTED' } } });\n      return adjustment;\n    });\n  }\n\n  async cancelAdjustment"
);

// Add audit before final return in cancelAdjustment
sa = sa.replace(
  "      await tx.stockAdjustment.update({ where: { id }, data: { status: 'CANCELLED' } });\n      return adjustment;\n    });\n  }\n}",
  "      await tx.stockAdjustment.update({ where: { id }, data: { status: 'CANCELLED' } });\n      await tx.auditLog.create({ data: { action: 'CANCEL', entity: 'STOCK_ADJUSTMENT', entity_id: id, before_data: { status: adjustment.status }, after_data: { status: 'CANCELLED' } } });\n      return adjustment;\n    });\n  }\n}"
);

fs.writeFileSync('src/inventory/stock-adjustment.service.ts', sa);
console.log('DONE: stock-adjustment.service.ts');
