const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/create/page.tsx', 'utf8');

const oldProductHtml = `<Select value={item.product_id} onValueChange={(v: any) => {
                    const newItems = [...items]; 
                    newItems[index].product_id = v;
                    // Auto fill price if possible
                    const prod = products.find(p => p.id === v || p._id === v);
                    if (prod && prod.sell_price) newItems[index].unit_price = prod.sell_price;
                    setItems(newItems);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pilih Produk..." /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id || p._id} value={p.id || p._id}>
                          {p.code ? \`[\${p.code}] \` : ''}{p.name || 'Unknown Product'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>`;

const newProductHtml = `<SearchableSelect 
                    options={products}
                    value={item.product_id}
                    onChange={(v: any) => {
                      const newItems = [...items]; 
                      newItems[index].product_id = v;
                      const prod = products.find((p: any) => p.id === v || p._id === v);
                      if (prod && prod.sell_price) newItems[index].unit_price = prod.sell_price;
                      setItems(newItems);
                    }}
                    placeholder="Pilih Produk..."
                  />`;

content = content.replace(oldProductHtml, newProductHtml);

fs.writeFileSync('frontend/src/app/sales/orders/create/page.tsx', content);
