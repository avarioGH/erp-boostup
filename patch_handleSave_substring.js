const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/page.tsx", "utf8");

const markerStart = "const handleSave = async (e: React.FormEvent) => {";
const markerEnd = "const filteredCustomers = customers";

const startIndex = content.indexOf(markerStart);
const endIndex = content.indexOf(markerEnd);

if (startIndex !== -1 && endIndex !== -1) {
  const newLogic = `const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
         await api.put(\`/customers/\${editId}\`, { name, phone, email });
      } else {
         await api.post("/customers", { name, phone, email });
      }
      setShowForm(false);
      setEditId(null);
      setName(""); setPhone(""); setEmail("");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    }
  }
  
  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.delete(\`/customers/\${id}\`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer");
    }
  }
  
  const openEdit = (e: any, c: any) => {
    e.stopPropagation();
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setShowForm(true);
  }

  `;

  content = content.substring(0, startIndex) + newLogic + content.substring(endIndex);
  fs.writeFileSync("frontend/src/app/crm/customers/page.tsx", content);
  console.log("SUCCESS!");
} else {
  console.log("FAILED TO FIND INDICES");
}

