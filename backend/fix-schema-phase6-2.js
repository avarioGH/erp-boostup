const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

// Remove the incorrect fields from Warehouse
schema = schema.replace(
  /  transferItems   StockTransferItem\[\]\n  adjustmentItems StockAdjustmentItem\[\]\n/,
  ""
);

// Add fields to TimberVariant specifically
schema = schema.replace(
  /sawnOutputItems SawnTimberOutputItem\[\]\n  timberStocks    TimberStock\[\]/,
  `sawnOutputItems SawnTimberOutputItem[]\n  timberStocks    TimberStock[]\n  transferItems   StockTransferItem[]\n  adjustmentItems StockAdjustmentItem[]`
);

fs.writeFileSync("prisma/schema.prisma", schema, "utf8");
