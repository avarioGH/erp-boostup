const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

c = c.replace(
  'criteria        String\n    inspection_type String?',
  'criteria        String\n    quality_checks QualityCheck[] @relation("QualityPointChecks")\n    inspection_type String?'
);

// We also need `asset_masters` or `work_center_id` in AssetMaster?
// Wait, scheduling.service.ts uses:
// b.asset.work_center_id
// We must add work_center_id to AssetMaster
c = c.replace(
  'model AssetMaster {\n    id               String      @id @default(auto()) @map("_id") @db.ObjectId',
  'model AssetMaster {\n    id               String      @id @default(auto()) @map("_id") @db.ObjectId\n    work_center_id String? @db.ObjectId\n    work_center WorkCenter? @relation("WorkCenterAssets", fields: [work_center_id], references: [id])'
)

// And add asset_masters to WorkCenter
c = c.replace(
  'shift_end_time String?\n}',
  'shift_end_time String?\n  asset_masters AssetMaster[] @relation("WorkCenterAssets")\n}'
)

fs.writeFileSync('backend/prisma/schema.prisma', c);
console.log('done2');
