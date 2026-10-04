const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');

if (!c.includes('SelectContent')) {
    c = c.replace(
        "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from \"@/components/ui/table\"",
        "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from \"@/components/ui/table\"\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \"@/components/ui/select\""
    );
}

// Replace the native select with Shadcn select for product
c = c.replace(
    /<select\s+className="w-full border p-2 rounded-md"\s+value=\{item\.product_id\}\s+onChange=\{e => handleItemChange\(index, 'product_id', e\.target\.value\)\}\s+required\s*>\s*<option value="">-- Pilih Ikan --<\/option>\s*\{products\.map\(pr => \(\s*<option key=\{pr\.id\} value=\{pr\.id\}>\{pr\.name\}<\/option>\s*\)\)\}\s*<\/select>/g,
    `<Select value={item.product_id} onValueChange={(val) => handleItemChange(index, 'product_id', val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Pilih Ikan --" />
                          </SelectTrigger>
                          <SelectContent searchable>
                            {products.map(pr => (
                              <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>`
);

// Do the same for partner and warehouse if they use native select
c = c.replace(
    /<select\s+className="w-full border p-2 rounded-md"\s+value=\{formData\.partner_id\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, partner_id: e\.target\.value\}\)\}\s+required\s*>\s*<option value="">-- Pilih Nelayan --<\/option>\s*\{partners\.map\(p => \(\s*<option key=\{p\.id\} value=\{p\.id\}>\{p\.name\}<\/option>\s*\)\)\}\s*<\/select>/g,
    `<Select value={formData.partner_id} onValueChange={(val) => setFormData({...formData, partner_id: val})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Pilih Nelayan --" />
                        </SelectTrigger>
                        <SelectContent searchable>
                          {partners.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>`
);

c = c.replace(
    /<select\s+className="w-full border p-2 rounded-md"\s+value=\{formData\.warehouse_id\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, warehouse_id: e\.target\.value\}\)\}\s+required\s*>\s*<option value="">-- Pilih Gudang --<\/option>\s*\{warehouses\.map\(w => \(\s*<option key=\{w\.id\} value=\{w\.id\}>\{w\.name\}<\/option>\s*\)\)\}\s*<\/select>/g,
    `<Select value={formData.warehouse_id} onValueChange={(val) => setFormData({...formData, warehouse_id: val})}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- Pilih Gudang --" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(w => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>`
);


fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', c);
