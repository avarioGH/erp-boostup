const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// Add indexes to TimberStockMovement
content = content.replace(
  /model TimberStockMovement \{([\s\S]*?)\}/, 
  (match, p1) => {
    if (match.includes("@@index([timberStockId, date])")) return match; // already added
    let newContent = p1 + "\n  @@index([timberStockId, date])\n  @@index([referenceType, referenceId])\n";
    return `model TimberStockMovement {${newContent}}`;
  }
);

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Added indexes to TimberStockMovement');
