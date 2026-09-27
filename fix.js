const fs = require('fs');
let text = fs.readFileSync('frontend/src/app/inventory/input-logs/create/page.tsx', 'utf8');
text = text.replace(/<th className="p-3 text-right">Net[^<]*<\/th>/g, `<th className="p-3 text-right">Gross M³</th>\n <th className="p-3 text-right">Hollow M³</th>\n <th className="p-3 text-right">Input Net M³</th>`);
text = text.replace(/colSpan=\{5\}/g, `colSpan={7}`);
fs.writeFileSync('frontend/src/app/inventory/input-logs/create/page.tsx', text, 'utf8');
