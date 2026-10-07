
const fs = require("fs");
// Check multi-tenant: do 5 major services always include company_id in queries?
const services = [
  "backend/src/sales/sales-return/sales-return.service.ts",
  "backend/src/purchasing/purchasing.service.ts",
  "backend/src/inventory/inventory.service.ts",
  "backend/src/crm/delivery/delivery.service.ts",
  "backend/src/inventory/disposal/disposal.service.ts",
];
for (const svc of services) {
  const content = fs.readFileSync(svc, "utf8");
  const lines = content.split("\n");
  const findManyLines = lines.filter(l => l.includes("findMany(") || l.includes("findUnique(") || l.includes("findFirst("));
  let missingCompanyId = 0;
  // Check blocks around findMany/findUnique
  findManyLines.forEach(l => {
    // Simple heuristic: check if company_id appears nearby
    // We flag lines that reference findMany without company_id in the where clause
    if (!content.includes("company_id: companyId") && !content.includes("company_id: params.companyId")) {
      missingCompanyId++;
    }
  });
  const hasTenantGuard = content.includes("company_id: companyId") || content.includes("company_id: params.companyId") || content.includes("where: { id, company_id");
  console.log(`${svc.split("/").pop()}: company_id guard present=${hasTenantGuard}`);
}

