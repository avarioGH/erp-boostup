const fs = require("fs");
let invContent = fs.readFileSync("backend/src/inventory/inventory.service.ts", "utf8");

const issueStockStart = "async issueStock(tx: Prisma.TransactionClient, params: {";
let issueIdx = invContent.indexOf(issueStockStart);

if (issueIdx !== -1) {
  const marker = "if (!stock) throw new BadRequestException('Stock not found for product ' + params.productId);";
  const markerIdx = invContent.indexOf(marker, issueIdx);
  if (markerIdx !== -1) {
    const newLogic = `if (!stock) {
      if (params.allowNegative) {
        stock = await tx.warehouseStock.create({
          data: {
            company_id: params.companyId,
            warehouse_id: params.warehouseId,
            product_id: params.productId,
            current_stock: 0,
            available_stock: 0,
            reserved_stock: 0
          }
        });
      } else {
        throw new BadRequestException('Stock not found for product ' + params.productId);
      }
    }`;
    invContent = invContent.substring(0, markerIdx) + newLogic + invContent.substring(markerIdx + marker.length);
    fs.writeFileSync("backend/src/inventory/inventory.service.ts", invContent);
    console.log("SUCCESS REPLACE");
  } else {
    console.log("MARKER NOT FOUND");
  }
} else {
  console.log("ISSUE STOCK NOT FOUND");
}

