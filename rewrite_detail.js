const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/purchase/[id]/page.tsx', 'utf8');

const targetHeader = `              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>T &times; W &times; L</TableHead>
                <TableHead>PCS</TableHead>
                <TableHead>M&sup3;</TableHead>
                <TableHead>Partai</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>`;

const replaceHeader = `              <TableRow>
                <TableHead>Product / SKU</TableHead>
                <TableHead>Supplier Declaration (T\u00d7W\u00d7L)</TableHead>
                <TableHead>PCS</TableHead>
                <TableHead>M&sup3;</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Partai</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>`;

const targetBody = `                <TableRow key={i}>
                  <TableCell className="font-semibold">{item.timberVariant?.sku || item.timberVariantId}</TableCell>
                  <TableCell>{item.timberVariant?.species || "-"}</TableCell>
                  <TableCell>{item.timberVariant?.grade || "-"}</TableCell>
                  <TableCell>{item.timberVariant ? \`\${item.timberVariant.thickness} \\u00d7 \${item.timberVariant.width} \\u00d7 \${item.timberVariant.length}\` : "-"}</TableCell>
                  <TableCell className="font-bold">{item.quantityPcs?.toLocaleString()}</TableCell>
                  <TableCell className="text-primary font-bold">{item.volumeM3?.toFixed(4)}</TableCell>
                  <TableCell>
                    {item.batch && item.batch !== "UNKNOWN" ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{item.batch}</Badge>
                    ) : (
                      <Badge variant="secondary">UNKNOWN</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic text-sm">{item.notes || "-"}</TableCell>
                </TableRow>`;

const replaceBody = `                <TableRow key={i}>
                  <TableCell>
                    <div className="font-semibold">{item.timberVariant?.sku || item.timberVariantId}</div>
                    <div className="text-xs text-muted-foreground">{item.timberVariant?.species} &bull; {item.timberVariant?.grade}</div>
                  </TableCell>
                  <TableCell>
                    {item.purchaseThickness && item.purchaseWidth && item.purchaseLength 
                      ? <div className="font-medium text-amber-700 dark:text-amber-500">{item.purchaseThickness} &times; {item.purchaseWidth} &times; {item.purchaseLength}</div>
                      : <div className="text-muted-foreground italic">-</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Canonical: {item.timberVariant?.thickness} &times; {item.timberVariant?.width} &times; {item.timberVariant?.length}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{item.quantityPcs?.toLocaleString()}</TableCell>
                  <TableCell className="text-primary font-bold">{item.volumeM3?.toFixed(4)}</TableCell>
                  <TableCell>{item.unitPrice ? \`Rp \${item.unitPrice.toLocaleString()}\` : "-"}</TableCell>
                  <TableCell>
                    {item.batch && item.batch !== "UNKNOWN" ? (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{item.batch}</Badge>
                    ) : (
                      <Badge variant="secondary">UNKNOWN</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground italic text-sm">{item.notes || "-"}</TableCell>
                </TableRow>`;

content = content.replace(targetHeader, replaceHeader);
content = content.replace(targetBody, replaceBody);
fs.writeFileSync('frontend/src/app/inventory/purchase/[id]/page.tsx', content, 'utf8');
console.log('Successfully updated purchase detail view.');
