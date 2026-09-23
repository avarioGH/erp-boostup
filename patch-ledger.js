const fs = require('fs');
let content = fs.readFileSync('backend/src/inventory/inventory-ledger.service.ts', 'utf-8');

// Replace the old checking and updating logic
content = content.replace(/} else \{\s*if \(type === 'OUT' && stock\.currentPcs < quantityPcs\) \{\s*throw new BadRequestException\([^)]+\);\s*\}\s*\}/, '}');

// Replace the tx.timberStock.update
const oldUpdate = `await tx.timberStock.update({
      where: { id: stock.id },
      data: updateData
    });`;

const newUpdate = `let whereCondition: any = { id: stock.id };
    if (type === 'OUT') {
      whereCondition.currentPcs = { gte: quantityPcs };
    }

    const updateResult = await tx.timberStock.updateMany({
      where: whereCondition,
      data: updateData
    });

    if (updateResult.count === 0) {
      if (type === 'OUT') {
        throw new BadRequestException(\`Insufficient stock or concurrent modification for variant \${timberVariantId}. Required: \${quantityPcs}\`);
      } else {
        throw new BadRequestException('Failed to update stock due to concurrent modification');
      }
    }`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync('backend/src/inventory/inventory-ledger.service.ts', content);
console.log('Fixed');
