const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

const uiToInject = `<div className="space-y-2">
    <div className="flex justify-between items-center">
       <p className="text-sm font-medium text-foreground">Pelanggan</p>
       <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsNewCustomer(!isNewCustomer)}>
          {isNewCustomer ? "Pilih Eksisting" : "+ Pelanggan Baru"}
       </Button>
    </div>
    {isNewCustomer ? (
       <div className="flex gap-2">
         <Input placeholder="Nama" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
         <Input placeholder="No HP" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
       </div>
    ) : (
       <select 
         className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
         value={selectedCustomerId}
         onChange={(e) => setSelectedCustomerId(e.target.value)}
       >
         <option value="">-- Umum / Tanpa Nama --</option>
         {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? \` - \${c.phone}\` : ""}</option>)}
       </select>
    )}
</div>

<div className="text-center p-4 bg-accent rounded-xl border border-border">`;

content = content.replace("<div className=\"text-center p-4 bg-accent rounded-xl border border-border\">", uiToInject);

const logicToInject = `setIsCheckingOut(true);
   try {
     let finalCustomerId = selectedCustomerId;
     if (isNewCustomer && newCustomerName) {
        const res = await api.post("/customers", { name: newCustomerName, phone: newCustomerPhone });
        finalCustomerId = res.data.id;
     }

     const payload = {
       customerId: finalCustomerId || undefined,`;

content = content.replace(`setIsCheckingOut(true);\n   try {\n   const payload = {`, logicToInject);

fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

