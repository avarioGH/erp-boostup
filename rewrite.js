const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/purchase/create/page.tsx', 'utf8');

const target = `                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                    <div className="space-y-2">
                      <Label>Timber Variant / SKU *</Label>
                      <Select value={item.timberVariantId} onValueChange={(val: any) => handleItemChange(index, 'timberVariantId', val)}>
                        <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                        <SelectContent>
                          {variants.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.sku} ({v.thickness}x{v.width}x{v.length})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Partai / Batch *</Label>
                      <Input 
                        placeholder="Contoh: PRT-2026-A"
                        value={item.batch} 
                        onChange={(e) => handleItemChange(index, 'batch', e.target.value)} 
                      />
                    </div>
                  </div>

                  {variantObj && (
                    <div className="bg-muted/50 p-3 rounded-md grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div><span className="text-muted-foreground block text-xs">Species</span><span className="font-medium">{variantObj.species}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Grade</span><span className="font-medium">{variantObj.grade}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Dimensions</span><span className="font-medium">{variantObj.thickness} &times; {variantObj.width} &times; {variantObj.length} mm</span></div>
                      <div className="col-span-2 md:col-span-2"><span className="text-muted-foreground block text-xs">SKU</span><span className="font-medium font-mono">{variantObj.sku}</span></div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity (PCS) *</Label>
                      <Input type="number" min="1" value={item.quantityPcs || ""} onChange={(e) => handleItemChange(index, 'quantityPcs', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total M&sup3;</Label>
                      <Input type="number" value={item.volumeM3 || ""} readOnly className="bg-muted font-bold text-primary" />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                      <Label>Keterangan / Notes</Label>
                      <Input placeholder="Optional remarks" value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                    </div>
                  </div>`;

const replacement = `                  <div className="grid grid-cols-1 gap-4 mr-8">
                    <div className="space-y-2">
                      <Label>Timber Variant / SKU *</Label>
                      <Select value={item.timberVariantId} onValueChange={(val: any) => handleItemChange(index, 'timberVariantId', val)}>
                        <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                        <SelectContent>
                          {variants.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.sku} ({v.thickness}x{v.width}x{v.length})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {variantObj && (
                    <div className="bg-muted/50 p-3 rounded-md grid grid-cols-2 md:grid-cols-5 gap-2 text-sm border-l-2 border-primary">
                      <div><span className="text-muted-foreground block text-xs">Species</span><span className="font-medium">{variantObj.species}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Grade</span><span className="font-medium">{variantObj.grade}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Canonical Dims</span><span className="font-medium">{variantObj.thickness} &times; {variantObj.width} &times; {variantObj.length} mm</span></div>
                      <div className="col-span-2 md:col-span-2"><span className="text-muted-foreground block text-xs">SKU</span><span className="font-medium font-mono">{variantObj.sku}</span></div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-semibold">Supplier Declaration</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-md bg-background">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">T (mm)</Label>
                        <Input type="number" min="1" placeholder="Thickness" value={item.purchaseThickness || ""} onChange={(e) => handleItemChange(index, 'purchaseThickness', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">W (mm)</Label>
                        <Input type="number" min="1" placeholder="Width" value={item.purchaseWidth || ""} onChange={(e) => handleItemChange(index, 'purchaseWidth', parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">P (mm)</Label>
                        <Input type="number" min="1" placeholder="Length" value={item.purchaseLength || ""} onChange={(e) => handleItemChange(index, 'purchaseLength', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity (PCS) *</Label>
                      <Input type="number" min="1" value={item.quantityPcs || ""} onChange={(e) => handleItemChange(index, 'quantityPcs', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Volume (M&sup3;)</Label>
                      <Input type="number" value={item.volumeM3 || ""} readOnly className="bg-muted font-bold text-primary" title="Calculated from canonical variant" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Price (Rp)</Label>
                      <Input type="number" min="0" placeholder="0" value={item.unitPrice || ""} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Partai / Batch *</Label>
                      <Input 
                        placeholder="Contoh: PRT-2026-A"
                        value={item.batch} 
                        onChange={(e) => handleItemChange(index, 'batch', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input placeholder="Optional remarks" value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                    </div>
                  </div>`;

if (!content.includes('grid-cols-1 md:grid-cols-2 gap-4 mr-8')) {
  console.log('Target string not found in file!');
} else {
  content = content.replace(target, replacement);
  fs.writeFileSync('frontend/src/app/inventory/purchase/create/page.tsx', content, 'utf8');
  console.log('Successfully replaced content in Create Purchase form.');
}
