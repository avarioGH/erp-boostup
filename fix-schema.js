const fs = require("fs");
let schema = fs.readFileSync("backend/prisma/schema.prisma", "utf8");

const newInputLog = `model InputLog {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  inputNumber     String   @unique
  date            DateTime @default(now())
  shift           String?
  machine         String?
  bundleRef       String?
  batch           String?
  species         String
  totalQty        Int
  totalLength     Float?
  totalGross      Float?
  totalGerowong   Float?
  totalTrimming   Float?
  totalVolume     Float    
  
  locationId      String?  @db.ObjectId
  location        Warehouse? @relation(fields: [locationId], references: [id])
  status          String   @default("AVAILABLE") 
  notes           String?
  
  items           InputLogItem[]
  trimmedLogs     TrimmedLog[] 
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}`;

schema = schema.replace(/model InputLog \{[\s\S]*?updatedAt\s+DateTime @updatedAt\n\s*\}/, newInputLog);

const newTrimRel = `inputLog        InputLog? @relation(fields: [inputLogId], references: [id])
  inputLogItem    InputLogItem?`;
schema = schema.replace(/inputLog\s+InputLog\?\s+@relation\(fields: \[inputLogId\], references: \[id\]\)/, newTrimRel);

fs.writeFileSync("backend/prisma/schema.prisma", schema, "utf8");
