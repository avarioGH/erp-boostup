
const fs = require("fs");
let content = fs.readFileSync("backend/src/inventory/inventory.service.ts", "utf8");

content = content.replace(
  /if \(transaction\.status !== .Draft.\)\s*throw new BadRequestException\(.Only Draft opname can be approved.\);/,
  "const updateCheck = await tx.inventoryTransaction.updateMany({ where: { id, status: \"Draft\" }, data: { status: \"Processing\" } }); if (updateCheck.count === 0) throw new BadRequestException(\"Only Draft opname can be approved or it is already processing\");"
);

content = content.replace(
  /if \(transaction\.status !== .Draft.\)\s*throw new BadRequestException\(\s*.Only Draft adjustments can be validated.,\s*\);/,
  "const updateCheck = await tx.inventoryTransaction.updateMany({ where: { id, status: \"Draft\" }, data: { status: \"Processing\" } }); if (updateCheck.count === 0) throw new BadRequestException(\"Only Draft adjustments can be validated or it is already processing\");"
);

fs.writeFileSync("backend/src/inventory/inventory.service.ts", content);

