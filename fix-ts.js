const fs = require('fs');
let file = 'frontend/src/app/inventory/input-logs/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/reduce\(\(sum, i\) => sum \+ \(i\.trimmedLog\?\.hollowVolume \|\| 0\), 0\)/, "reduce((sum: number, i: any) => sum + (i.trimmedLog?.hollowVolume || 0), 0)");

fs.writeFileSync(file, content);
