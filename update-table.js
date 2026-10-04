const fs = require('fs');
let file = 'frontend/src/app/inventory/inflow/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change Total Item to Rincian Ikan
content = content.replace(
  '<th className="px-6 py-4 font-medium text-muted-foreground">Total Item</th>',
  '<th className="px-6 py-4 font-medium text-muted-foreground">Rincian Ikan</th>'
);

// Change the td body
content = content.replace(
  '<td className="px-6 py-4">{item.items?.length || 0} Barang</td>',
  `<td className="px-6 py-4">
                        {item.items && item.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {item.items.map((it: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {it.product?.name || 'Ikan'} <strong className="ml-1">x{it.qty}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>`
);

fs.writeFileSync(file, content);
