const fs = require("fs");
let code = fs.readFileSync("frontend/src/lib/api.ts", "utf8");

const financeAdd = `  getTransactions: async () => [],
  getSummary: async () => ({ cashInHand: 0, cashInBank: 0 }),
`;

code = code.split("getInvoices: async").join(financeAdd + "  getInvoices: async");
fs.writeFileSync("frontend/src/lib/api.ts", code);
