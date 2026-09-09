const fs = require("fs");
let code = fs.readFileSync("frontend/src/lib/api.ts", "utf8");

const financeAdd = `  getTransactions: async () => [],
  getSummary: async () => ({ cashInHand: 0, cashInBank: 0 }),
`;

code = code.replace("getInvoices: async", financeAdd + "  getInvoices: async");
fs.writeFileSync("frontend/src/lib/api.ts", code);
