const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Undo the bad product replace
code = code.replace(/product_id String @db\.ObjectId\n  product Product\? @relation\(fields: \[product_id\], references: \[id\]\)/g, 'product_id String @db.ObjectId');

// And specifically add product to QualityCheck
function fixQualityCheck(code) {
  const marker = "model QualityCheck {";
  const lines = code.split('\n');
  let inQC = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) inQC = true;
    if (inQC && lines[i].includes('product_id String @db.ObjectId')) {
      if (!lines[i+1].includes('product Product')) {
        lines.splice(i+1, 0, '  product Product @relation(fields: [product_id], references: [id])');
      }
    }
    if (inQC && lines[i].trim() === '}') break;
  }
  return lines.join('\n');
}

code = fixQualityCheck(code);
fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
