const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  // Create dir
  const dir = path.join(__dirname, 'docs', 'go-live');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  // 1. README
  fs.writeFileSync(path.join(dir, 'README.md'), '# Go-Live Approval Package\n\nThis directory contains the final sign-off forms required to explicitly approve the ERP Go-Live.');

  // 2. ATLAS BACKUP VERIFICATION
  const atlasTpl = `# MongoDB Atlas Production Backup Verification

Production cluster:
erp-boostup.qbaqxyw.mongodb.net

Production database:
erp_db

## Administrator

Name:
Role:
Date:

## Backup

Backup enabled:
[ ] YES
[ ] NO
[ ] NOT VERIFIED

Continuous backup:
[ ] YES
[ ] NO
[ ] NOT VERIFIED

PITR:
[ ] ENABLED
[ ] DISABLED
[ ] NOT VERIFIED

Retention:
________________

Production database covered:
[ ] YES
[ ] NO
[ ] NOT VERIFIED

Latest recoverable point:
________________

## Restore Test

Restore target:
________________

Target is non-production:
[ ] YES
[ ] NO

Restore completed:
[ ] YES
[ ] NO

Restore timestamp:
________________

Restore duration:
________________

Prisma read verification:
[ ] PASS
[ ] FAIL
[ ] NOT PERFORMED

Application read-only verification:
[ ] PASS
[ ] FAIL
[ ] NOT PERFORMED

## Evidence

Atlas screenshot/reference:
________________

Notes:
________________

Administrator approval:
________________
`;
  fs.writeFileSync(path.join(dir, 'ATLAS_BACKUP_VERIFICATION.md'), atlasTpl);

  // 3. STORAGE BACKUP VERIFICATION
  const storageTpl = `# Production Storage Backup Verification

Production storage path:

STORAGE_BASE_PATH

## Storage Administrator

Name:
Role:
Date:

## Backup Mechanism

Mechanism:
________________

Examples:

S3
Object Storage
Separate Server
Block Snapshot
Other

Backup destination:
________________

Destination is separate from production VPS:

[ ] YES
[ ] NO
[ ] NOT VERIFIED

Frequency:
________________

Retention:
________________

Latest successful backup:
________________

## Restore Test

Restore target:
________________

Production storage overwritten:
[ ] NO

Restore completed:
[ ] YES
[ ] NO

Files readable:
[ ] YES
[ ] NO

Directory structure preserved:
[ ] YES
[ ] NO

Representative file verified:
[ ] YES
[ ] NO

## Evidence

Backup reference:
________________

Restore reference:
________________

Administrator approval:
________________
`;
  fs.writeFileSync(path.join(dir, 'STORAGE_BACKUP_VERIFICATION.md'), storageTpl);

  // 4. BUSINESS ACCEPTANCE
  const businessTpl = `# ERP Business Acceptance

Business owner:

Name:
Role:
Date:

## Master Data

Species:
[ ] APPROVED
[ ] PENDING

Grade:
[ ] APPROVED
[ ] PENDING

Source/Supplier:
[ ] APPROVED
[ ] PENDING

Warehouse:
[ ] APPROVED
[ ] PENDING

Physical Location:
[ ] APPROVED
[ ] PENDING

Vehicle:
[ ] APPROVED
[ ] PENDING

Driver:
[ ] APPROVED
[ ] PENDING

## Operational Workflows

Purchase:
[ ] APPROVED
[ ] PENDING

Actual Receiving:
[ ] APPROVED
[ ] PENDING

Trimming:
[ ] APPROVED
[ ] PENDING

Input:
[ ] APPROVED
[ ] PENDING

Sawmill Production:
[ ] APPROVED
[ ] PENDING

Grading:
[ ] APPROVED
[ ] PENDING

GESEK / PLAT / MASAK:
[ ] APPROVED
[ ] PENDING

Shipment / Fuso:
[ ] APPROVED
[ ] PENDING

Stock Opname:
[ ] APPROVED
[ ] PENDING

Reporting:
[ ] APPROVED
[ ] PENDING

Print Documents:
[ ] APPROVED
[ ] PENDING

## RTO / RPO

RTO:
________________

RPO:
________________

Approved by:
________________

## Business Comments

________________

## Final Business Decision

[ ] APPROVED FOR GO-LIVE

[ ] NOT YET APPROVED
`;
  fs.writeFileSync(path.join(dir, 'BUSINESS_ACCEPTANCE.md'), businessTpl);

  // 5. FINAL GO-LIVE SIGNOFF
  const signoffTpl = `# ERP FINAL GO-LIVE SIGN-OFF

## Software Acceptance

Code integrity:
PASS

Tenant isolation:
PASS

Inventory:
PASS

Purchase:
PASS

Receiving:
PASS

Production:
PASS

Shipment:
PASS

Stock Opname:
PASS

Reporting:
PASS

UAT regression:
PASS

## Infrastructure Acceptance

Atlas Backup:
NOT VERIFIED

PITR:
NOT VERIFIED

Database Restore:
NOT VERIFIED

Storage Backup:
NOT VERIFIED

Storage Restore:
NOT VERIFIED

Full ERP Recovery:
NOT VERIFIED

## Business Acceptance

Business approval:
PENDING

RTO:
PENDING

RPO:
PENDING

## Production Safety

Production mutation during audit:

0

Production database:

erp_db

## Final Gate

Current status:

BLOCKED \u2014 INFRASTRUCTURE AND BUSINESS EVIDENCE PENDING

### Final Evidence Checklist

#### Infrastructure
[ ] Atlas admin assigned
[ ] Backup enabled verified
[ ] PITR verified
[ ] Retention verified
[ ] erp_db coverage verified
[ ] Recovery point verified
[ ] Non-production restore completed
[ ] Restored DB verified
[ ] Prisma verified
[ ] Isolated application verified

#### Storage
[ ] Storage backup mechanism exists
[ ] Destination is independent
[ ] Frequency defined
[ ] Retention defined
[ ] Latest backup verified
[ ] Storage restore completed
[ ] Representative files verified

#### Business
[ ] Master data approved
[ ] Workflow approved
[ ] Reports approved
[ ] Prints approved
[ ] RTO approved
[ ] RPO approved
[ ] Business owner approved

## Historical Data
Known historical residuals:
RawLog: 6
TrimmedLog: 5
InputLog: 4
SawnTimberOutput: 1
Total: 16
Classification: Historical / Seed / Test residuals
Cleanup requires explicit business authorization.

## Final Go-Live Decision Logic
GO-LIVE APPROVED ONLY IF:
Infrastructure: PASS
AND
Business: APPROVED
AND
Production safety: PASS
Otherwise: GO-LIVE BLOCKED
`;
  fs.writeFileSync(path.join(dir, 'FINAL_GO_LIVE_SIGNOFF.md'), signoffTpl);

  // Get Baseline
  const models = [
    'company', 'warehouse', 'location', 'timberSpecies', 'timberGrade', 'timberSource', 'timberVariant',
    'timberStock', 'timberStockMovement', 'timberPurchase', 'timberPurchaseLogItem', 'rawLog', 'trimmedLog',
    'inputLog', 'sawnTimberOutput', 'sawnTimberOutputItem', 'timberSalesOrder', 'timberSalesOrderItem',
    'timberShipment', 'timberShipmentItem', 'stockAdjustment', 'stockAdjustmentItem',
    'stockTransfer', 'stockTransferItem', 'productionProcess', 'productionProcessInput', 'productionProcessOutput',
    'timberStockOpname', 'timberStockOpnameItem'
  ];
  
  console.log("PRODUCTION COUNTS:");
  for (const m of models) {
    if (prod[m]) {
      const c = await prod[m].count();
      console.log(`${m}: ${c}`);
    }
  }

  prod.$disconnect();
}
run();
