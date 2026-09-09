const fs = require('fs');
require('child_process').execSync('git checkout backend/prisma/schema.prisma');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// 1. AccountingPeriod extension
code = code.replace(
  'model AccountingPeriod {\\n  id         String   @id @default(auto()) @map("_id") @db.ObjectId\\n  company_id String   @db.ObjectId\\n  company    Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\\n  month      Int\\n  year       Int\\n  start_date DateTime\\n  end_date   DateTime\\n  status     String // OPEN, CLOSED\\n\\n  created_at DateTime @default(now())\\n\\n  @@unique([company_id, month, year])\\n}',
  "model AccountingPeriod {\\n  id         String   @id @default(auto()) @map(\\"_id\\") @db.ObjectId\\n  company_id String   @db.ObjectId\\n  company    Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\\n  name       String?\\n  month      Int\\n  year       Int\\n  start_date DateTime\\n  end_date   DateTime\\n  status     String // OPEN, CLOSED, LOCKED\\n  \\n  closed_at  DateTime?\\n  closed_by  String?   @db.ObjectId\\n  closer     User?     @relation(\\"ClosedPeriods\\", fields: [closed_by], references: [id], onDelete: NoAction, onUpdate: NoAction)\\n\\n  created_at DateTime @default(now())\\n\\n  @@unique([company_id, month, year])\\n  @@index([company_id, start_date])\\n  @@index([company_id, end_date])\\n}"
);

// 2. Insert relations at top of models
function addFieldToModel(modelName, fieldDefinition) {
  const marker = "model " + modelName + " {";
  if (code.includes(marker) && !code.includes(fieldDefinition)) {
    code = code.replace(marker, marker + "\\n  " + fieldDefinition);
  }
}

addFieldToModel('User', 'closed_periods           AccountingPeriod[]   @relation("ClosedPeriods")');
addFieldToModel('Product', 'cost_layers InventoryCostLayer[]');
addFieldToModel('Warehouse', 'cost_layers InventoryCostLayer[]');
addFieldToModel('StockMovement', 'cost_layer_consumptions CostLayerConsumption[]');
addFieldToModel('ChartOfAccount', 'cash_accounts CashAccount[]');

// 3. Special field replacements (JournalEntry, CashAccount)
if (!code.includes('idempotency_key String?    @unique')) {
  code = code.replace(
    '  status         String // Draft, Pending, Approved, Posted, Closed',
    '  status         String // Draft, Pending, Approved, Posted, Closed\\n  idempotency_key String?    @unique'
  );
}

// target ONLY CashAccount
const cashAccountMarker = 'model CashAccount {';
const caIdx = code.indexOf(cashAccountMarker);
if (caIdx > -1) {
    const endIdx = code.indexOf('}', caIdx);
    let caBlock = code.substring(caIdx, endIdx);
    if (!caBlock.includes('chart_of_account_id String?   @db.ObjectId')) {
        caBlock = caBlock.replace(
            '  currency   String',
            '  currency   String\\n  chart_of_account_id String?   @db.ObjectId\\n  chart_of_account    ChartOfAccount? @relation(fields: [chart_of_account_id], references: [id], onDelete: NoAction, onUpdate: NoAction)'
        );
        code = code.substring(0, caIdx) + caBlock + code.substring(endIdx);
    }
}

// 4. Add Cost Layers
if (!code.includes('model InventoryCostLayer')) {
  code += \

model InventoryCostLayer {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id         String   @db.ObjectId
  product_id         String   @db.ObjectId
  product            Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)
  warehouse_id       String   @db.ObjectId
  warehouse          Warehouse @relation(fields: [warehouse_id], references: [id], onDelete: Cascade)
  
  quantity           Float
  unit_cost          Float
  remaining_quantity Float
  source_movement_id String   @db.ObjectId
  
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt

  consumptions       CostLayerConsumption[]
}

model CostLayerConsumption {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id         String   @db.ObjectId
  layer_id           String   @db.ObjectId
  layer              InventoryCostLayer @relation(fields: [layer_id], references: [id], onDelete: Cascade)
  stock_movement_id  String   @db.ObjectId
  stock_movement     StockMovement      @relation(fields: [stock_movement_id], references: [id], onDelete: Cascade)
  
  quantity           Float
  unit_cost          Float
  total_cost         Float

  created_at         DateTime @default(now())

  @@index([company_id, layer_id])
  @@index([company_id, stock_movement_id])
}
\;
}

// Fix escaped newlines that became literal "\\n"
code = code.replace(/\\\\n/g, '\\n');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
