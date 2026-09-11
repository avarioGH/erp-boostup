import re

with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    schema = f.read()

# Add missing fields to AssetMaster
asset_fields = """
  is_capitalized                      Boolean   @default(false)
  capitalization_date                 DateTime?
  residual_value                      Float     @default(0)
  accumulated_depreciation            Float     @default(0)
  asset_account_id                    String?
  accumulated_depreciation_account_id String?
  depreciation_expense_account_id     String?
  disposal_date                       DateTime?
  disposal_proceeds                   Float     @default(0)
"""
schema = re.sub(
    r'(model AssetMaster \{[\s\S]*?)(  histories)',
    r'\1' + asset_fields + r'\2',
    schema
)

# Add company_id to Attendance
schema = re.sub(
    r'(model Attendance \{[\s\S]*?employee_id String    @db\.ObjectId)',
    r'model Attendance {\n  company_id String? @db.ObjectId\n  employee_id String    @db.ObjectId',
    schema
)

# Add new models
new_models = """

model ExpenseClaim {
  id                  String        @id @default(auto()) @map("_id") @db.ObjectId
  company_id          String        @db.ObjectId
  employee_id         String        @db.ObjectId
  claim_number        String
  claim_date          DateTime
  title               String
  description         String?
  status              String
  total_amount        Float         @default(0)
  remaining_amount    Float         @default(0)
  created_by          String
  submitted_at        DateTime?
  approved_at         DateTime?
  approved_by         String?
  posted_at           DateTime?
  finance_reviewed_by String?
  
  items               ExpenseItem[]
  
  created_at          DateTime      @default(now())
  updated_at          DateTime      @updatedAt
}

model ExpenseItem {
  id               String       @id @default(auto()) @map("_id") @db.ObjectId
  expense_claim_id String       @db.ObjectId
  expense_claim    ExpenseClaim @relation(fields: [expense_claim_id], references: [id], onDelete: Cascade)
  category_id      String       @db.ObjectId
  description      String?
  amount           Float
  expense_date     DateTime
  reference        String?
}

model PurchaseRequest {
  id             String                @id @default(auto()) @map("_id") @db.ObjectId
  company_id     String                @db.ObjectId
  request_number String
  required_date  DateTime?
  source         String
  status         String
  reason         String?
  warehouse_id   String?               @db.ObjectId
  
  items          PurchaseRequestItem[]
  
  created_at     DateTime              @default(now())
  updated_at     DateTime              @updatedAt
}

model PurchaseRequestItem {
  id                  String          @id @default(auto()) @map("_id") @db.ObjectId
  purchase_request_id String          @db.ObjectId
  purchase_request    PurchaseRequest @relation(fields: [purchase_request_id], references: [id], onDelete: Cascade)
  product_id          String          @db.ObjectId
  qty                 Float
  unit                String?
  notes               String?
}

model SupplierProduct {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id        String   @db.ObjectId
  supplier_id       String   @db.ObjectId
  supplier          Supplier @relation(fields: [supplier_id], references: [id], onDelete: Cascade)
  product_id        String   @db.ObjectId
  unit_price        Float
  minimum_order_qty Float    @default(1)
  lead_time_days    Int      @default(0)
  supplier_sku      String?
  active            Boolean  @default(true)
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}

model AssetDepreciation {
  id                       String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id               String      @db.ObjectId
  asset_id                 String      @db.ObjectId
  asset                    AssetMaster @relation(fields: [asset_id], references: [id], onDelete: Cascade)
  period                   String
  depreciation_date        DateTime
  amount                   Float
  opening_book_value       Float
  closing_book_value       Float
  accumulated_depreciation Float
  status                   String
  
  created_at               DateTime    @default(now())
  updated_at               DateTime    @updatedAt
  
  @@unique([company_id, asset_id, period])
}
"""

schema += new_models

# Add relation in AssetMaster for AssetDepreciation
schema = re.sub(
    r'(model AssetMaster \{[\s\S]*?)(  histories)',
    r'\1  asset_depreciations AssetDepreciation[]\n\2',
    schema
)

# Add relation in Employee for ExpenseClaim
schema = re.sub(
    r'(model Employee \{[\s\S]*?)(  created_at)',
    r'\1  expense_claims ExpenseClaim[]\n\2',
    schema
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(schema)

