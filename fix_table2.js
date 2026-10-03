const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/inventory/inflow/page.tsx", "utf8");
content = content.replace("<td className=\"px-6 py-4\">{item.warehouse?.name || '-'}</td>", "<td className=\"px-6 py-4\">{item.warehouse?.name || '-'}</td>\n                        <td className=\"px-6 py-4 text-muted-foreground truncate max-w-[200px]\">{item.notes || '-'}</td>");
fs.writeFileSync("frontend/src/app/inventory/inflow/page.tsx", content);

