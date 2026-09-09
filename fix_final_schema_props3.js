const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code += \
model Integration {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  company_id String @db.ObjectId
  provider String
  status String
  config Json?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model IntegrationCredential {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  company_id String @db.ObjectId
  provider String
  api_key String?
  secret_key String?
  webhook_secret String?
  environment String @default("sandbox")
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model IntegrationIdempotency {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  company_id String @db.ObjectId
  provider String
  key String
  status String
  response Json?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([company_id, provider, key])
}

model WebhookEvent {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  company_id String @db.ObjectId
  provider String
  event_type String
  payload Json
  status String
  error_message String?
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model ExternalReference {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  company_id String @db.ObjectId
  provider String
  entity_type String
  entity_id String @db.ObjectId
  external_id String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@unique([company_id, provider, entity_type, entity_id])
}
\;

// Add remaining missing fields based on tsc output
code = code.replace(/company_id\s+String\s+@db\.ObjectId\n\s+asset_id\s+String\s+@db\.ObjectId/g, 'company_id String @db.ObjectId\n  asset_id String @db.ObjectId\n  downtime_minutes Float?');
code = code.replace(/model MaintenanceSchedule \{\n  id\s+String\s+@id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, 'model MaintenanceSchedule {\n  id String @id @default(auto()) @map("_id") @db.ObjectId\n  company_id String? @db.ObjectId');
code = code.replace(/notes\s+String\?\n\s+inspected_by/g, 'notes String?\n  inspection_type String?\n  numeric_result Float?\n  inspected_by');
code = code.replace(/notes\s+String\?\n\s+created_at\s+DateTime/g, 'notes String?\n  quantity Float?\n  created_at DateTime');
code = code.replace(/entity_type String\?/g, 'entity_type String?\n  action_url String?');
code = code.replace(/required_date DateTime\?/g, 'required_date DateTime?\n  reason String?');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
