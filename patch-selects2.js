const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');

c = c.replace(
    /<select\s+className="w-full border p-2 rounded-md"\s+value=\{formData\.partner_id\}[\s\S]*?<\/select>/,
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

// also fix the payment status select
c = c.replace(
    /<select\s+className="w-full border p-2 rounded-md"\s+value=\{formData\.status\}[\s\S]*?<\/select>/,
    `<Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Status --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="CONFIRMED">Konfirmasi</SelectItem>
                  </SelectContent>
                </Select>`
);

fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', c);
