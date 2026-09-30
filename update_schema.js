const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const partaiModel = `
// ==================================================
// TIMBER PARTAI (PROJECT / BATCH)
// ==================================================
model TimberPartai {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id  String   @db.ObjectId
  company     Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  code        String   
  name        String?  
  status      String   @default("ACTIVE") // ACTIVE, COMPLETED, CANCELLED
  
  startDate   DateTime @default(now())
  endDate     DateTime?
  
  notes       String?
  createdBy   String?

  purchases         TimberPurchase[]
  rawLogs           RawLog[]
  trimmedLogs       TrimmedLog[]
  inputLogs         InputLog[]
  sawnOutputs       SawnTimberOutput[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([company_id, code])
}
`;

if (!schema.includes('model TimberPartai')) {
    schema += partaiModel;
}

// Add relations to Company
if (!schema.includes('timberPartais TimberPartai[]')) {
    schema = schema.replace(/model Company \{/, "model Company {\n  timberPartais TimberPartai[]");
}

// Helper to inject relation
function injectRelation(modelName, relationField, fieldType) {
    const regex = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\}`);
    const match = schema.match(regex);
    if (match) {
        if (!match[0].includes('partaiId')) {
            const replacement = match[0].replace(/createdAt\\s+DateTime/, `partaiId String? @db.ObjectId\n  partai TimberPartai? @relation(fields: [partaiId], references: [id])\n\n  createdAt DateTime`);
            schema = schema.replace(match[0], replacement);
        }
    }
}

injectRelation('TimberPurchase', 'purchases', 'TimberPurchase[]');
injectRelation('RawLog', 'rawLogs', 'RawLog[]');
injectRelation('TrimmedLog', 'trimmedLogs', 'TrimmedLog[]');
injectRelation('InputLog', 'inputLogs', 'InputLog[]');
injectRelation('SawnTimberOutput', 'sawnOutputs', 'SawnTimberOutput[]');

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
