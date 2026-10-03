const fs = require("fs");
let content = fs.readFileSync("backend/prisma/schema.prisma", "utf8");
content = content.replace("payments    Payment[]", "payments    Payment[]\n  allocations PaymentAllocation[]");
fs.writeFileSync("backend/prisma/schema.prisma", content);

