const fs = require('fs');

// ============================================================
// 3. INPUT LOG SERVICE
// ============================================================
let inp = fs.readFileSync('src/inventory/input-log.service.ts', 'utf8');

// Add import
inp = inp.replace(
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';",
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { AuditService } from '../core/audit.service';"
);

// Add constructor param
inp = inp.replace(
  "  constructor(private prisma: PrismaService) {}",
  "  constructor(\n    private prisma: PrismaService,\n    private audit: AuditService\n  ) {}"
);

// After return inputLog in createInputLog, add audit
inp = inp.replace(
  "      return inputLog;\n    });\n  }\n\n  async cancelInputLog",
  "      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'INPUT_LOG', entity_id: inputLog.id, after_data: { inputNumber: inputLog.inputNumber } } });\n      return inputLog;\n    });\n  }\n\n  async cancelInputLog"
);

// After return log in cancelInputLog, add audit
inp = inp.replace(
  "      return log;\n    });\n  }\n}",
  "      await tx.auditLog.create({ data: { action: 'CANCEL', entity: 'INPUT_LOG', entity_id: id, before_data: { status: 'AVAILABLE' }, after_data: { status: 'CANCELLED' } } });\n      return log;\n    });\n  }\n}"
);

fs.writeFileSync('src/inventory/input-log.service.ts', inp);
console.log('DONE: input-log.service.ts');


// ============================================================
// 4. SAWN TIMBER SERVICE — add audit to postOutput and cancelOutput
// ============================================================
let st = fs.readFileSync('src/inventory/sawn-timber.service.ts', 'utf8');

st = st.replace(
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { InventoryLedgerService } from './inventory-ledger.service';",
  "import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';\nimport { PrismaService } from '../prisma/prisma.service';\nimport { InventoryLedgerService } from './inventory-ledger.service';\nimport { AuditService } from '../core/audit.service';"
);

st = st.replace(
  "  constructor(\n    private prisma: PrismaService,\n    private ledgerService: InventoryLedgerService\n  ) {}",
  "  constructor(\n    private prisma: PrismaService,\n    private ledgerService: InventoryLedgerService,\n    private audit: AuditService\n  ) {}"
);

fs.writeFileSync('src/inventory/sawn-timber.service.ts', st);
console.log('PATCHED: sawn-timber.service.ts - headers');
