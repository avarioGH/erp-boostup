
const fs = require("fs");
const content = fs.readFileSync("frontend/src/app/finance/vendor-bills/page.tsx", "utf8");
let updated = content.replace(
  /<th className="p-4 text-left font-medium">Sisa Hutang<\/th>/s,
  `<th className="p-4 text-left font-medium">Sisa Hutang / Kredit</th>`
);
updated = updated.replace(
  /<td className="p-4">Rp \{bill.remaining_amount.toLocaleString\(\)\}<\/td>/s,
  `<td className="p-4">
    {bill.remaining_amount < 0 ? (
      <span className="text-green-600 font-semibold">Kredit Rp {Math.abs(bill.remaining_amount).toLocaleString()}</span>
    ) : (
      <span>Rp {bill.remaining_amount.toLocaleString()}</span>
    )}
  </td>`
);
fs.writeFileSync("frontend/src/app/finance/vendor-bills/page.tsx", updated);

