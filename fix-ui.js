const fs = require('fs');

// 1. Fix create page
let createPage = 'frontend/src/app/inventory/input-logs/create/page.tsx';
let createContent = fs.readFileSync(createPage, 'utf8');

// calculation
createContent = createContent.replace(
  /const totalNet = selectedLogs\.reduce\(\(sum, l\) => sum \+ \(l\.netVolume \|\| 0\), 0\)/,
  "const totalNet = selectedLogs.reduce((sum, l) => sum + ((l.grossVolume || 0) - (l.hollowVolume || 0)), 0)"
);

// table headers
createContent = createContent.replace(
  /<th className="p-3 text-right">Net MÃ‚Â³<\/th>/,
  '<th className="p-3 text-right">Gross M³</th>\n <th className="p-3 text-right">Hollow M³</th>\n <th className="p-3 text-right">Input Net M³</th>'
);

// table body
createContent = createContent.replace(
  /<td className="p-3 text-right font-bold text-primary">\{log\.netVolume\}<\/td>/,
  '<td className="p-3 text-right">{(log.grossVolume || 0).toFixed(4)}</td>\n <td className="p-3 text-right">{(log.hollowVolume || 0).toFixed(4)}</td>\n <td className="p-3 text-right font-bold text-primary">{((log.grossVolume || 0) - (log.hollowVolume || 0)).toFixed(4)}</td>'
);

// replace MÃ‚Â³ encoding issues
createContent = createContent.replace(/MÃ‚Â³/g, 'M³');
createContent = createContent.replace(/Total Net M³/g, 'Total Input Net M³');

fs.writeFileSync(createPage, createContent);

// 2. Fix detail page
let detailPage = 'frontend/src/app/inventory/input-logs/[id]/page.tsx';
let detailContent = fs.readFileSync(detailPage, 'utf8');

// summary block
detailContent = detailContent.replace(
  /<div className="flex justify-between items-center"><span className="text-muted-foreground">Total Gross<\/span><span className="font-medium">\{data\.totalGross\?\.toFixed\(4\)\} m\?<\/span><\/div>/,
  '<div className="flex justify-between items-center"><span className="text-muted-foreground">Total Gross</span><span className="font-medium">{data.totalGross?.toFixed(4)} m³</span></div>\n <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Hollow/Gerowong</span><span className="font-medium">{data.items?.reduce((sum, i) => sum + (i.trimmedLog?.hollowVolume || 0), 0).toFixed(4)} m³</span></div>'
);

detailContent = detailContent.replace(
  /<span className="font-bold text-foreground font-bold">Total Net Volume<\/span>/,
  '<span className="font-bold text-foreground font-bold">Total Input Net M³</span>'
);

detailContent = detailContent.replace(/m\?/g, 'm³');

// table headers
detailContent = detailContent.replace(
  /<th className="p-3 px-6 text-right">Gross M³<\/th>\s*<th className="p-3 px-6 text-right">Net M³<\/th>/,
  '<th className="p-3 px-6 text-right">Gross M³</th>\n <th className="p-3 px-6 text-right">Hollow M³</th>\n <th className="p-3 px-6 text-right">Input Net M³</th>'
);

// table body
detailContent = detailContent.replace(
  /<td className="p-3 px-6 text-right">\{item\.trimmedLog\?\.grossVolume\}<\/td>\s*<td className="p-3 px-6 text-right font-bold">\{item\.trimmedLog\?\.netVolume\}<\/td>/,
  '<td className="p-3 px-6 text-right">{(item.trimmedLog?.grossVolume || 0).toFixed(4)}</td>\n <td className="p-3 px-6 text-right">{(item.trimmedLog?.hollowVolume || 0).toFixed(4)}</td>\n <td className="p-3 px-6 text-right font-bold">{((item.trimmedLog?.grossVolume || 0) - (item.trimmedLog?.hollowVolume || 0)).toFixed(4)}</td>'
);

fs.writeFileSync(detailPage, detailContent);
