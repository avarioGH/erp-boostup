const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

schema = schema.replace(
  /warehouse_stocks\s+WarehouseStock\[\]/,
  `warehouse_stocks       WarehouseStock[]\n  sawnOutputs     SawnTimberOutput[]\n  timberStocks    TimberStock[]`
);

fs.writeFileSync("prisma/schema.prisma", schema, "utf8");
