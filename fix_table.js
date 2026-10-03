const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/inventory/inflow/page.tsx", "utf8");
content = content.replace('<th className="px-6 py-4 font-medium text-muted-foreground">Gudang</th>', '<th className="px-6 py-4 font-medium text-muted-foreground">Gudang</th>\n                    <th className="px-6 py-4 font-medium text-muted-foreground">Keterangan</th>');
content = content.replace('<td colSpan={5}', '<td colSpan={6}');
content = content.replace('<td colSpan={5}', '<td colSpan={6}'); // just in case there are two
content = content.replace('<td className="px-6 py-4">{item.warehouse?.name || '-'}</td>', '<td className="px-6 py-4">{item.warehouse?.name || '-'}</td>\n                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{item.notes || '-'}</td>');
fs.writeFileSync("frontend/src/app/inventory/inflow/page.tsx", content);

