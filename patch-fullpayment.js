const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/create/page.tsx', 'utf8');

const oldHtml = `<Label>Jumlah Dibayar (Rp)</Label>`;
const newHtml = `<div className="flex justify-between items-center">
                  <Label>Jumlah Dibayar (Rp)</Label>
                  <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setPaidAmount(totalAmount)}>
                    Dibayar Full
                  </Button>
                </div>`;

content = content.replace(oldHtml, newHtml);

fs.writeFileSync('frontend/src/app/sales/orders/create/page.tsx', content);
