const fs = require('fs');

// ============================================================
// 1. RAW LOG SERVICE - add AuditService + audit calls
// ============================================================
let raw = fs.readFileSync('src/inventory/raw-log.service.ts', 'utf8');

raw = raw.replace(
  `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimberCalculationService } from './timber-calculation.service';`,
  `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimberCalculationService } from './timber-calculation.service';
import { AuditService } from '../core/audit.service';`
);

raw = raw.replace(
  `  constructor(
    private prisma: PrismaService,
    private calcService: TimberCalculationService
  ) {}`,
  `  constructor(
    private prisma: PrismaService,
    private calcService: TimberCalculationService,
    private audit: AuditService
  ) {}`
);

// Add audit after rawLog.create
raw = raw.replace(
  `    return this.prisma.rawLog.create({
      data: {`,
  `    const created = await this.prisma.rawLog.create({
      data: {`
);
raw = raw.replace(
  `        notes: data.notes
      }
    });
  }

  async cancelRawLog`,
  `        notes: data.notes
      }
    });
    await this.audit.log({ action: 'CREATE', entity: 'RAW_LOG', entity_id: created.id, after_data: { logNumber: created.logNumber } });
    return created;
  }

  async cancelRawLog`
);

// Add audit in cancelRawLog
raw = raw.replace(
  `    return this.prisma.rawLog.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }
}`,
  `    const result = await this.prisma.rawLog.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    await this.audit.log({ action: 'CANCEL', entity: 'RAW_LOG', entity_id: id, before_data: { status: log.status }, after_data: { status: 'CANCELLED' } });
    return result;
  }
}`
);

fs.writeFileSync('src/inventory/raw-log.service.ts', raw);
console.log('DONE: raw-log.service.ts');
