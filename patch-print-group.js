const fs = require('fs');
const file = 'frontend/src/app/sales/exports/[id]/print/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const groupedItems = \(data\.items \|\| \[\]\)\.reduce\(\(acc: any, item: any\) => \{[\s\S]*?return acc\s*\}, \{\}\)/,
  `const groupedItems = (data.items || []).reduce((acc: any, item: any) => {
    const gName = (item.groupName || "-").trim().toUpperCase();
    if (!acc[gName]) acc[gName] = [];
    acc[gName].push(item);
    return acc;
  }, {});`
);

fs.writeFileSync(file, content);
