const fs = require("fs");
let schema = fs.readFileSync("backend/prisma/schema.prisma", "utf8");

// Add sawnOutputs to InputLog
schema = schema.replace(
  /items\s+InputLogItem\[\]/,
  `items           InputLogItem[]\n  sawnOutputs     SawnTimberOutput[]`
);

// Add relations to Warehouse
schema = schema.replace(
  /warehouseStocks\s+WarehouseStock\[\]/,
  `warehouseStocks WarehouseStock[]\n  sawnOutputs     SawnTimberOutput[]\n  timberStocks    TimberStock[]`
);

// Add relations to TimberVariant
schema = schema.replace(
  /volumePerPiece\s+Float\s+\/\/ Calculated as T\*W\*L\/1B/,
  `volumePerPiece  Float // Calculated as T*W*L/1B\n  sawnOutputItems SawnTimberOutputItem[]\n  timberStocks    TimberStock[]`
);

fs.writeFileSync("backend/prisma/schema.prisma", schema, "utf8");
