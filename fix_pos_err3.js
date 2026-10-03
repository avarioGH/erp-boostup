const fs = require("fs");
let invContent = fs.readFileSync("backend/src/inventory/inventory.service.ts", "utf8");

const issueStockStart = "async issueStock(tx: Prisma.TransactionClient, params: {";
let issueIdx = invContent.indexOf(issueStockStart);

if (issueIdx !== -1) {
  const marker = "const stock = await tx.warehouseStock.findUnique({";
  const markerIdx = invContent.indexOf(marker, issueIdx);
  if (markerIdx !== -1) {
    invContent = invContent.substring(0, markerIdx) + "let stock = await tx.warehouseStock.findUnique({" + invContent.substring(markerIdx + marker.length);
    fs.writeFileSync("backend/src/inventory/inventory.service.ts", invContent);
    console.log("SUCCESS REPLACE CONST TO LET");
  }
}

