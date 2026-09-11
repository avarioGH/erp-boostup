const fs = require('fs');

function addAuditImport(content) {
  return content.replace(
    /import \{ Injectable/,
    "import { AuditService } from '../core/audit.service';\nimport { Injectable"
  );
}

// ============================================================
// 2. TRIMMED LOG SERVICE
// ============================================================
let t = fs.readFileSync('src/inventory/trimmed-log.service.ts', 'utf8');
t = addAuditImport(t);
t = t.replace(
  'private calcService: TimberCalculationService\n  ) {}',
  'private calcService: TimberCalculationService,\n    private audit: AuditService\n  ) {}'
);
// After child creation, add audit log
t = t.replace(
  '      return child;\n    });\n  }\n\n  async cancelTrimmedLog',
  '      await tx.auditLog.create({ data: { action: \'CREATE\', entity: \'TRIMMED_LOG\', entity_id: child.id, after_data: { trimNumber: child.trimNumber } } });\n      return child;\n    });\n  }\n\n  async cancelTrimmedLog'
);
// cancel audit
t = t.replace(
  "    return this.prisma.trimmedLog.update({ where: { id }, data: { status: 'CANCELLED' } });\n  }",
  "    const result = await this.prisma.trimmedLog.update({ where: { id }, data: { status: 'CANCELLED' } });\n    await this.audit.log({ action: 'CANCEL', entity: 'TRIMMED_LOG', entity_id: id, before_data: { status: log.status }, after_data: { status: 'CANCELLED' } });\n    return result;\n  }"
);
fs.writeFileSync('src/inventory/trimmed-log.service.ts', t);
console.log('DONE: trimmed-log.service.ts');
