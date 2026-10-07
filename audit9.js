
const fs = require("fs");
// Check Finance service getProfitLossReport is from FinanceTransaction or GL
const finance = fs.readFileSync("backend/src/finance/finance.service.ts", "utf8");
// Check if any GL-based P&L exists
const hasGLQuery = finance.includes("journalEntry") || finance.includes("generalLedger") || finance.includes("JournalEntry");
const hasCashFlowReport = finance.includes("getCashFlowReport");
const hasPLFromGL = finance.includes("journalEntry.findMany") || finance.includes("chartOfAccount");
console.log("P&L uses GL:", hasGLQuery);
console.log("P&L uses GL journal entries:", hasPLFromGL);
console.log("CashFlowReport exists:", hasCashFlowReport);

// check if there is a separate GL P&L service
const glService = fs.readFileSync("backend/src/accounting/accounting.service.ts", "utf8");
const hasPL = glService.includes("profitAndLoss") || glService.includes("getProfitLoss") || glService.includes("trialBalance");
console.log("\\nGL service has P&L:", hasPL);
console.log("GL service content:", glService.substring(0, 1500));

