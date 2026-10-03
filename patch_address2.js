const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/page.tsx", "utf8");

// Re-do state additions properly
if (!content.includes("const [address, setAddress]")) {
   content = content.replace("const [email, setEmail] = useState(\"\")", "const [email, setEmail] = useState(\"\")\n const [address, setAddress] = useState(\"\")");
   content = content.replace(/{ name, phone, email }/g, "{ name, phone, email, address }");
   content = content.replace(/setEmail\(\"\"\);/g, "setEmail(\"\"); setAddress(\"\");");
   content = content.replace(/setEmail\(c.email \|\| \"\"\);/g, "setEmail(c.email || \"\"); setAddress(c.address || \"\");");
}

const oldFormSection = `<div className="space-y-2 md:col-span-2">
   <Label>Email Address</Label>
   <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@abc.com" />
   </div>`;

const newFormSection = `<div className="space-y-2">
   <Label>Email Address</Label>
   <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@abc.com" />
   </div>
   <div className="space-y-2 md:col-span-2">
   <Label>Location / Address</Label>
   <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Sudirman No. 1..." />
   </div>`;

if (content.includes(oldFormSection)) {
   content = content.replace(oldFormSection, newFormSection);
} else {
   console.log("Could not find old form section");
}

fs.writeFileSync("frontend/src/app/crm/customers/page.tsx", content);

