const fs = require('fs');

// ============================================================
// 5. STOCK TRANSFER SERVICE
// ============================================================
let st = fs.readFileSync('src/inventory/stock-transfer.service.ts', 'utf8');
st = st.replace(
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { InventoryLedgerService } from './inventory-ledger.service';",
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { InventoryLedgerService } from './inventory-ledger.service';\nimport { AuditService } from '../core/audit.service';"
);
st = st.replace(
  "  constructor(\n    private prisma: PrismaService,\n    private ledgerService: InventoryLedgerService\n  ) {}",
  "  constructor(\n    private prisma: PrismaService,\n    private ledgerService: InventoryLedgerService,\n    private audit: AuditService\n  ) {}"
);
// createTransfer: after return transfer (inside tx)
st = st.replace(
  "      return transfer;\n    });\n  }\n\n  async postTransfer",
  "      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'STOCK_TRANSFER', entity_id: transfer.id, after_data: { status: transfer.status } } });\n      return transfer;\n    });\n  }\n\n  async postTransfer"
);
// postTransfer: after last ledger movement
st = st.replace(
  "      return transfer;\n    });\n  }\n\n  async cancelTransfer",
  "      await tx.auditLog.create({ data: { action: 'POST', entity: 'STOCK_TRANSFER', entity_id: id, before_data: { status: 'DRAFT' }, after_data: { status: 'POSTED' } } });\n      return transfer;\n    });\n  }\n\n  async cancelTransfer"
);
// cancelTransfer: before final return
st = st.replace(
  "      await tx.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });\n      return transfer;\n    });\n  }\n}",
  "      await tx.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });\n      await tx.auditLog.create({ data: { action: 'CANCEL', entity: 'STOCK_TRANSFER', entity_id: id, before_data: { status: transfer.status }, after_data: { status: 'CANCELLED' } } });\n      return transfer;\n    });\n  }\n}"
);
fs.writeFileSync('src/inventory/stock-transfer.service.ts', st);
console.log('DONE: stock-transfer.service.ts');

// ============================================================
// 6. STOCK ADJUSTMENT SERVICE
// ============================================================
let sa = fs.readFileSync('src/inventory/stock-adjustment.service.ts', 'utf8');
sa = sa.replace(
  /import \{ Injectable[^\n]+\}\s+from '@nestjs\/common';/,
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { AuditService } from '../core/audit.service';"
);
// add AuditService to constructor if InventoryLedgerService present
if (sa.includes('private ledgerService: InventoryLedgerService')) {
  sa = sa.replace(
    /private ledgerService: InventoryLedgerService\s*\)\s*\{\}/,
    "private ledgerService: InventoryLedgerService,\n    private audit: AuditService\n  ) {}"
  );
} else {
  sa = sa.replace(
    /constructor\(private prisma: PrismaService\)\s*\{\}/,
    "constructor(\n    private prisma: PrismaService,\n    private audit: AuditService\n  ) {}"
  );
}
console.log('PATCHED: stock-adjustment.service.ts header');
fs.writeFileSync('src/inventory/stock-adjustment.service.ts', sa);
