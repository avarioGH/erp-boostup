
const fs = require("fs");
const content = fs.readFileSync("backend/src/crm/quotation/sales-order.controller.ts", "utf8");
// Find all create calls
const matches = [];
const lines = content.split("\n");
lines.forEach((l, i) => {
  if (l.includes(".create(") && !l.includes("//")) {
    matches.push({ line: i+1, content: l.trim() });
  }
});
console.log("CREATE CALLS IN SO CONTROLLER:", JSON.stringify(matches, null, 2));

