const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

// Warehouse
schema = schema.replace(
  /timberStocks\s+TimberStock\[\]/,
  `timberStocks    TimberStock[]\n  transfersFrom   StockTransfer[] @relation("TransferFromLocation")\n  transfersTo     StockTransfer[] @relation("TransferToLocation")\n  adjustments     StockAdjustment[]`
);

// TimberVariant
schema = schema.replace(
  /timberStocks\s+TimberStock\[\]/,
  `timberStocks    TimberStock[]\n  transferItems   StockTransferItem[]\n  adjustmentItems StockAdjustmentItem[]`
);

fs.writeFileSync("prisma/schema.prisma", schema, "utf8");
