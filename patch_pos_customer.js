const fs = require("fs");
let posContent = fs.readFileSync("backend/src/pos/pos.service.ts", "utf8");

posContent = posContent.replace("const { companyId, userId, warehouseId, customerId, paymentMethod, items, subtotal, tax, total, idempotency_key } = data;", 
`const { companyId, userId, warehouseId, paymentMethod, items, subtotal, tax, total, idempotency_key, newCustomerName, newCustomerPhone, newCustomerAddress } = data;
    let customerId = data.customerId;`);

// Find "// 1. Create Sales Order (Receipt)" and inject customer creation before it
posContent = posContent.replace("// 1. Create Sales Order (Receipt)",
`// 0.5 Create New Customer if requested
      if (!customerId && newCustomerName) {
        const newCust = await tx.customer.create({
          data: {
            company_id: companyId,
            name: newCustomerName,
            phone: newCustomerPhone || undefined,
            address: newCustomerAddress || undefined,
            status: "ACTIVE"
          }
        });
        customerId = newCust.id;
      }

      // 1. Create Sales Order (Receipt)`);

fs.writeFileSync("backend/src/pos/pos.service.ts", posContent);
console.log("BACKEND PATCHED");

