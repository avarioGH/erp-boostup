const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/page.tsx", "utf8");

// Add address state
content = content.replace("const [email, setEmail] = useState(\"\")", "const [email, setEmail] = useState(\"\")\n const [address, setAddress] = useState(\"\")");

// Update handleSave to include address
content = content.replace(/{ name, phone, email }/g, "{ name, phone, email, address }");

// Update reset state
content = content.replace(/setEmail\(\"\"\);/g, "setEmail(\"\"); setAddress(\"\");");

// Update openEdit to load address
content = content.replace(/setEmail\(c.email \|\| \"\"\);/g, "setEmail(c.email || \"\"); setAddress(c.address || \"\");");

// Add Address input to form
const addressField = `<div className="space-y-2 md:col-span-2">
   <Label>Alamat / Location</Label>
   <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Sudirman No. 1..." />
   </div>`;

content = content.replace(`   <div className="space-y-2 md:col-span-2">
   <Label>Email Address</Label>`, `   <div className="space-y-2 md:col-span-1">
   <Label>Email Address</Label>
   <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@abc.com" />
   </div>
   ${addressField}
   <div className="hidden">`); // Hacky way to hide the old email input since I recreated it

fs.writeFileSync("frontend/src/app/crm/customers/page.tsx", content);

