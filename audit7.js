
const fs = require("fs");
// Check how much of the system has idempotency keys
const services = [
  "backend/src/sales/sales-return/sales-return.service.ts",
  "backend/src/purchasing/purchase-return/purchase-return.service.ts",
  "backend/src/inventory/disposal/disposal.service.ts",
  "backend/src/crm/delivery/delivery.service.ts",
];
for (const svc of services) {
  const content = fs.readFileSync(svc, "utf8");
  const hasDraftGuard = content.includes("status: \"Draft\"") || content.includes("status: \"DRAFT\"") || content.includes("DRAFT -> PROCESSING") || content.includes("status: { in: [\"Draft\"]") || content.includes("updateMany({ where: { id");
  const hasIdempotencyKey = content.includes("idempotency_key") || content.includes("idempotencyKey");
  const hasUniqueConstraint = content.includes("transaction_no") || content.includes("order_number") || content.includes("return_number");
  console.log(`${svc.split("/").pop()}: DraftGuard=${hasDraftGuard}, IdempKey=${hasIdempotencyKey}, UniqNum=${hasUniqueConstraint}`);
}

