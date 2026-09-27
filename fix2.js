const fs = require('fs');
let text = fs.readFileSync('frontend/src/app/inventory/input-logs/[id]/page.tsx', 'utf8');
text = text.replace(/<th className="p-3 px-6 text-right">Net[^<]*<\/th>/g, `<th className="p-3 px-6 text-right">Hollow/Gerowong M³</th>\n <th className="p-3 px-6 text-right">Input Net M³</th>`);
fs.writeFileSync('frontend/src/app/inventory/input-logs/[id]/page.tsx', text, 'utf8');
