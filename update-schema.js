const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// 1. Add relations to Company
const companyRegex = /model Company \{[\s\S]*?\}/;
content = content.replace(companyRegex, (match) => {
  if (match.includes('timberSpecies')) return match;
  return match.replace(/}$/, `  timberSpecies TimberSpecies[]\n  timberGrades TimberGrade[]\n  timberSources TimberSource[]\n  vehicles Vehicle[]\n  drivers Driver[]\n}`);
});

// 2. Add relation to Warehouse
const warehouseRegex = /model Warehouse \{[\s\S]*?\}/;
content = content.replace(warehouseRegex, (match) => {
  if (match.includes('locations Location[]')) return match;
  return match.replace(/}$/, `  locations Location[]\n}`);
});

// 3. Update TimberVariant
const variantRegex = /model TimberVariant \{[\s\S]*?\}/;
content = content.replace(variantRegex, (match) => {
  if (match.includes('speciesId String?')) return match;
  return match.replace('species         String', `species         String\n  speciesId       String?                  @db.ObjectId\n  timberSpecies   TimberSpecies?           @relation(fields: [speciesId], references: [id])\n  gradeId         String?                  @db.ObjectId\n  timberGrade     TimberGrade?             @relation(fields: [gradeId], references: [id])`);
});

// 4. Update RawLog
const rawLogRegex = /model RawLog \{[\s\S]*?\}/;
content = content.replace(rawLogRegex, (match) => {
  if (match.includes('speciesId String?')) return match;
  return match.replace('species        String // Jenis Kayu', `species        String // Jenis Kayu\n  speciesId      String?                  @db.ObjectId\n  timberSpecies  TimberSpecies?           @relation(fields: [speciesId], references: [id])\n  sourceId       String?                  @db.ObjectId\n  timberSource   TimberSource?            @relation(fields: [sourceId], references: [id])`);
});

// 5. Update TrimmedLog
const trimmedLogRegex = /model TrimmedLog \{[\s\S]*?\}/;
content = content.replace(trimmedLogRegex, (match) => {
  if (match.includes('speciesId String?')) return match;
  return match.replace('species       String', `species       String\n  speciesId     String?                  @db.ObjectId\n  timberSpecies TimberSpecies?           @relation(fields: [speciesId], references: [id])\n  sourceId      String?                  @db.ObjectId\n  timberSource  TimberSource?            @relation(fields: [sourceId], references: [id])`);
});

// 6. Update InputLog
const inputLogRegex = /model InputLog \{[\s\S]*?\}/;
content = content.replace(inputLogRegex, (match) => {
  if (match.includes('speciesId String?')) return match;
  return match.replace('species      String', `species      String\n  speciesId    String?                  @db.ObjectId\n  timberSpecies TimberSpecies?          @relation(fields: [speciesId], references: [id])\n  sourceId     String?                  @db.ObjectId\n  timberSource TimberSource?            @relation(fields: [sourceId], references: [id])`);
});

// 7. Update TimberStock
const timberStockRegex = /model TimberStock \{[\s\S]*?\}/;
content = content.replace(timberStockRegex, (match) => {
  if (match.includes('locationId String?')) return match;
  return match.replace('warehouseId     String        @db.ObjectId', `warehouseId     String        @db.ObjectId\n  locationId      String?       @db.ObjectId\n  location        Location?     @relation(fields: [locationId], references: [id])`);
});

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Done extending existing models');
