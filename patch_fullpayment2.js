const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

const startStr = "<p className=\"text-sm font-medium text-foreground\">Jumlah Pembayaran</p>";

const startIndex = content.indexOf(startStr);
if (startIndex !== -1) {
  const newStr = `<div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Jumlah Pembayaran</p>
                <button type="button" onClick={() => setPaidAmount(total)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-md transition-colors shadow-sm">Bayar Lunas</button>
              </div>`;
              
  content = content.replace(startStr, newStr);
  fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);
  console.log("SUCCESS");
}

