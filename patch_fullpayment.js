const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

const oldHtml = `<p className="text-sm font-medium text-foreground">Jumlah Pembayaran</p>
              <div className="relative">`;

const newHtml = `<div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Jumlah Pembayaran</p>
                <button type="button" onClick={() => setPaidAmount(total)} className="text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Bayar Full</button>
              </div>
              <div className="relative">`;

content = content.replace(oldHtml, newHtml);
fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

