const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

const trimmedLogRegex = /model TrimmedLog \{[\s\S]*?\}/;
content = content.replace(trimmedLogRegex, (match) => {
  if (match.includes('speciesId')) return match;
  return match.replace('species         String', `species         String\n  speciesId     String?                  @db.ObjectId\n  timberSpecies TimberSpecies?           @relation(fields: [speciesId], references: [id])\n  sourceId      String?                  @db.ObjectId\n  timberSource  TimberSource?            @relation(fields: [sourceId], references: [id])`);
});

const inputLogRegex = /model InputLog \{[\s\S]*?\}/;
content = content.replace(inputLogRegex, (match) => {
  if (match.includes('speciesId')) return match;
  return match.replace('species       String', `species       String\n  speciesId    String?                  @db.ObjectId\n  timberSpecies TimberSpecies?          @relation(fields: [speciesId], references: [id])\n  sourceId     String?                  @db.ObjectId\n  timberSource TimberSource?            @relation(fields: [sourceId], references: [id])`);
});

const timberStockRegex = /model TimberStock \{[\s\S]*?\}/;
content = content.replace(timberStockRegex, (match) => {
  if (match.includes('subLocationId')) return match;
  return match.replace('location        Warehouse     @relation(fields: [locationId], references: [id])', `location        Warehouse     @relation(fields: [locationId], references: [id])\n  subLocationId   String?       @db.ObjectId\n  subLocation     Location?     @relation(fields: [subLocationId], references: [id])`);
});

// Update Location model relation to match 'subLocationId'
content = content.replace('timberStocks TimberStock[]', 'timberStocks TimberStock[]');

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Fixed');
