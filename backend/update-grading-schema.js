const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

const gradingModels = `
// ==================================================
// PHASE 26: GRADING & QC WORKFLOW
// ==================================================
model TimberGrading {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  gradingNumber String   @unique
  date          DateTime @default(now())
  
  warehouseId   String   @db.ObjectId
  warehouse     Warehouse @relation(fields: [warehouseId], references: [id])
  
  // The input is a specific stock (usually UNGRADED)
  inputStockId  String   @db.ObjectId
  inputStock    TimberStock @relation("GradingInput", fields: [inputStockId], references: [id])
  
  inputQtyPcs   Int
  inputVolumeM3 Float
  
  status        String   @default("DRAFT") // DRAFT, CONFIRMED, CANCELLED
  
  outputs       TimberGradingOutput[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
}

model TimberGradingOutput {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  gradingId        String   @db.ObjectId
  grading          TimberGrading @relation(fields: [gradingId], references: [id], onDelete: Cascade)
  
  timberVariantId  String   @db.ObjectId
  timberVariant    TimberVariant @relation(fields: [timberVariantId], references: [id])
  
  quantityPcs      Int
  volumeM3         Float
}
`;

content += gradingModels;

content = content.replace(/model TimberStock \{([\s\S]*?)\}/, (match, p1) => {
    if (match.includes("gradingsAsInput TimberGrading[]")) return match;
    let newContent = p1 + "\n  gradingsAsInput TimberGrading[] @relation(\"GradingInput\")\n";
    return `model TimberStock {${newContent}}`;
});

content = content.replace(/model Warehouse \{([\s\S]*?)\}/, (match, p1) => {
    if (match.includes("timberGradings TimberGrading[]")) return match;
    let newContent = p1 + "\n  timberGradings TimberGrading[]\n";
    return `model Warehouse {${newContent}}`;
});

content = content.replace(/model TimberVariant \{([\s\S]*?)\}/, (match, p1) => {
    if (match.includes("gradingOutputs TimberGradingOutput[]")) return match;
    let newContent = p1 + "\n  gradingOutputs TimberGradingOutput[]\n";
    return `model TimberVariant {${newContent}}`;
});

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Added TimberGrading models and inverse relations');
