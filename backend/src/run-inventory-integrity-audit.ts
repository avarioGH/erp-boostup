import { PrismaClient } from '@prisma/client';
import { InventoryIntegrityAuditService } from './inventory/reconciliation/inventory-integrity-audit.service';
import * as fs from 'fs';

async function bootstrap() {
  const companyId = process.argv[2];
  if (!companyId) {
    console.error('FAILED: Missing target company ID. Usage: ts-node run-inventory-integrity-audit.ts <companyId>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      console.error(`FAILED: Company ${companyId} not found.`);
      process.exit(1);
    }
    if (company.name !== 'Boostup ERP') {
      console.error(`FAILED: Expected "Boostup ERP", got "${company.name}"`);
      process.exit(1);
    }

    const auditService = new InventoryIntegrityAuditService(prisma);
    console.log(`Starting Phase 45.9A Read-Only Inventory Integrity Audit for ${companyId}...`);
    
    const report = await auditService.runAudit(companyId);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `inventory_integrity_report_${companyId}_${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`Audit complete. Report saved to ${filename}`);
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap();
