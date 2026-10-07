const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const searchUI = `<TabsContent value="sales" className="space-y-4 mt-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input 
            placeholder="Cari Quotation / Order #..." 
            value={salesSearch} 
            onChange={(e) => setSalesSearch(e.target.value)} 
            className="max-w-sm" 
          />
          <div className="flex gap-2 items-center">
            <Input 
              type="date" 
              value={salesStartDate} 
              onChange={(e) => setSalesStartDate(e.target.value)} 
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              type="date" 
              value={salesEndDate} 
              onChange={(e) => setSalesEndDate(e.target.value)} 
            />
          </div>
        </div>`;

code = code.replace(
  /<TabsContent value="sales" className="space-y-4 mt-4">/,
  searchUI
);

// Replace mapping for quotations
code = code.replace(/\{sales\.quotations\.map/g, '{filteredQuotations.map');
code = code.replace(/\{sales\.quotations\.length === 0/g, '{filteredQuotations.length === 0');

// Replace mapping for orders
code = code.replace(/\{sales\.orders\.map/g, '{filteredOrders.map');
code = code.replace(/\{sales\.orders\.length === 0/g, '{filteredOrders.length === 0');

fs.writeFileSync(path, code);
console.log('patched UI and arrays');
