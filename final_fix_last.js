const fs = require("fs");
function fix(file, oldStr, newStr) {
  let content = fs.readFileSync(file, "utf8");
  content = content.split(oldStr).join(newStr);
  fs.writeFileSync(file, content);
}

fix("frontend/src/lib/api.ts", "api.get(/sales/quotations/$id)", "api.get(`/sales/quotations/${id}`)");
fix("frontend/src/lib/api.ts", "api.post(/sales/quotations/$id/confirm)", "api.post(`/sales/quotations/${id}/confirm`)");
fix("frontend/src/lib/api.ts", "api.get(/sales/orders/$id)", "api.get(`/sales/orders/${id}`)");

