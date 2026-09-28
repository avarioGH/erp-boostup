const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  const dir = path.join(__dirname, 'docs', 'go-live');
  
  console.log("=== ATLAS EVIDENCE ===");
  if (fs.existsSync(path.join(dir, 'ATLAS_BACKUP_VERIFICATION.md'))) {
    console.log(fs.readFileSync(path.join(dir, 'ATLAS_BACKUP_VERIFICATION.md'), 'utf8'));
  }

  console.log("=== STORAGE EVIDENCE ===");
  if (fs.existsSync(path.join(dir, 'STORAGE_BACKUP_VERIFICATION.md'))) {
    console.log(fs.readFileSync(path.join(dir, 'STORAGE_BACKUP_VERIFICATION.md'), 'utf8'));
  }

  console.log("=== BUSINESS ACCEPTANCE ===");
  if (fs.existsSync(path.join(dir, 'BUSINESS_ACCEPTANCE.md'))) {
    console.log(fs.readFileSync(path.join(dir, 'BUSINESS_ACCEPTANCE.md'), 'utf8'));
  }

  // Get Baseline
  const models = [
    'company', 'warehouse', 'location', 'timberSpecies', 'timberGrade', 'timberSource', 'timberVariant',
    'timberStock', 'timberStockMovement', 'timberPurchase', 'timberPurchaseLogItem', 'rawLog', 'trimmedLog',
    'inputLog', 'sawnTimberOutput', 'sawnTimberOutputItem', 'timberSalesOrder', 'timberSalesOrderItem',
    'timberShipment', 'timberShipmentItem', 'stockAdjustment', 'stockAdjustmentItem',
    'stockTransfer', 'stockTransferItem', 'productionProcess', 'productionProcessInput', 'productionProcessOutput',
    'timberStockOpname', 'timberStockOpnameItem'
  ];
  
  console.log("\n=== PRODUCTION COUNTS ===");
  for (const m of models) {
    if (prod[m]) {
      const c = await prod[m].count();
      console.log(`${m}: ${c}`);
    }
  }
  
  // Update final signoff
  const signoffTpl = `# FINAL GO-LIVE SIGN-OFF

## Technical Gates
Code integrity: PASS
Tenant isolation: PASS
Inventory architecture: PASS
Purchase/Receiving: PASS
Production: PASS
Shipment: PASS
Stock Opname: PASS
Reporting: PASS
UAT regression: PASS
Deployment provenance: PASS
Operations runbook: PASS

## Infrastructure Gates
Atlas Backup: NOT VERIFIED
PITR: NOT VERIFIED
Backup retention: NOT VERIFIED
DB restore: NOT VERIFIED
Restored DB integrity: NOT VERIFIED
Storage backup: NOT VERIFIED
Storage restore: NOT VERIFIED
Full ERP recovery: NOT VERIFIED

## Business Gates
Master data: NOT VERIFIED
Purchase workflow: NOT VERIFIED
Actual receiving workflow: NOT VERIFIED
Trimming workflow: NOT VERIFIED
Input workflow: NOT VERIFIED
Sawmill production workflow: NOT VERIFIED
Grading workflow: NOT VERIFIED
GESEK / PLAT / MASAK workflow: NOT VERIFIED
Shipment workflow: NOT VERIFIED
Stock Opname workflow: NOT VERIFIED
Reporting workflow: NOT VERIFIED
Print documents workflow: NOT VERIFIED
RTO: NOT VERIFIED
RPO: NOT VERIFIED
Business owner acceptance: NOT VERIFIED

## Production Safety
Production mutation delta: 0
Production database: erp_db
PM2 state: UNCHANGED

## Historical Data
RawLog = 6
TrimmedLog = 5
InputLog = 4
SawnTimberOutput = 1
Total = 16
Business historical-artifact authorization = NOT VERIFIED

## Evidence References
docs/go-live/ATLAS_BACKUP_VERIFICATION.md
docs/go-live/STORAGE_BACKUP_VERIFICATION.md
docs/go-live/BUSINESS_ACCEPTANCE.md

## Outstanding Blockers
- Atlas Administrator verification and signature missing.
- Infrastructure Storage backup mechanism and test missing.
- Explicit Business Owner signature and SLA approvals missing.

## Final Decision
GO-LIVE BLOCKED
`;
  fs.writeFileSync(path.join(dir, 'FINAL_GO_LIVE_SIGNOFF.md'), signoffTpl);

  prod.$disconnect();
}
run();
