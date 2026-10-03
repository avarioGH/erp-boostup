const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

content = content.replace("const [newCustomerPhone, setNewCustomerPhone] = useState(\"\")", 
`const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")`);

content = content.replace(/<div className="flex gap-2">\s*<Input placeholder="Nama".*\/>\s*<Input placeholder="No HP".*\/>\s*<\/div>/g, 
`<div className="flex flex-col gap-2">
           <div className="flex gap-2">
             <Input placeholder="Nama" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
             <Input placeholder="No HP" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
           </div>
           <Input placeholder="Alamat (Opsional)" value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} />
         </div>`);

content = content.replace("idempotency_key: idempotencyKey,",
`idempotency_key: idempotencyKey,
   customerId: !isNewCustomer ? selectedCustomerId : undefined,
   newCustomerName: isNewCustomer ? newCustomerName : undefined,
   newCustomerPhone: isNewCustomer ? newCustomerPhone : undefined,
   newCustomerAddress: isNewCustomer ? newCustomerAddress : undefined,
   paidAmount,`);

fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);
console.log("FRONTEND PATCHED");

