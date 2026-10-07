
const fs = require("fs");
const content = fs.readFileSync("backend/src/crm/quotation/sales-order.controller.ts", "utf8");
// Check if an invoice is created during sales order creation 
const hasInvoice = content.includes("invoice.create") || content.includes("Invoice");
const hasIssueStock = content.includes("issueStock");
const hasCOGS = content.includes("COGS") || content.includes("cogs");
const hasFinanceTx = content.includes("financeTransaction") || content.includes("FinanceTransaction");
console.log("Invoice create in SO:", hasInvoice);
console.log("IssueStock in SO:", hasIssueStock);
console.log("COGS in SO:", hasCOGS);
console.log("FinanceTransaction in SO:", hasFinanceTx);
// Check where COGS is generated in delivery
const delivery = fs.readFileSync("backend/src/crm/delivery/delivery.service.ts", "utf8");
const delHasIssue = delivery.includes("issueStock");
const delHasInvoice = delivery.includes("invoice.create") || delivery.includes("Invoice.create");
const delHasFinanceTx = delivery.includes("financeTransaction");
const delHasCOGS = delivery.includes("COGS") || delivery.includes("cogs") || delivery.includes("totalDeliveryCogs");
console.log("\\nDelivery: issueStock:", delHasIssue);
console.log("Delivery: Invoice create:", delHasInvoice);
console.log("Delivery: FinanceTransaction:", delHasFinanceTx);
console.log("Delivery: COGS:", delHasCOGS);

