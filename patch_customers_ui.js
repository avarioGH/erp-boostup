const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/page.tsx", "utf8");

// Add editId state
content = content.replace("const [email, setEmail] = useState(\"\")", "const [email, setEmail] = useState(\"\")\n const [editId, setEditId] = useState<string|null>(null)");

// Replace handleSave
const newHandleSave = `const handleSave = async (e: React.FormEvent) => {
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
  }`;

content = content.replace(/const handleSave = async \([\s\S]*?\}\n \}/, newHandleSave);

// Replace button text dynamically
content = content.replace("Create New Customer", "{editId ? \"Edit Customer\" : \"Create New Customer\"}");
content = content.replace("Create Customer", "{editId ? \"Update Customer\" : \"Create Customer\"}");

// Add edit/delete icons to imports if missing
content = content.replace("import { Plus, Search", "import { Edit, Trash2, Plus, Search");

// Modify the Action buttons
const newActions = `<td className="p-3 px-4 text-right">
   <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
     <Button variant="ghost" size="sm" onClick={(e) => openEdit(e, c)} className="h-8 w-8 p-0">
       <Edit className="h-4 w-4 text-blue-500" />
     </Button>
     <Button variant="ghost" size="sm" onClick={(e) => handleDelete(e, c.id)} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
       <Trash2 className="h-4 w-4 text-red-500" />
     </Button>
     <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); router.push(\`/crm/customers/\${c.id}\`); }}>
       View 360 <ArrowRight className="ml-1 h-3 w-3" />
     </Button>
   </div>
   </td>`;

content = content.replace(/<td className="p-3 px-4 text-right">[\s\S]*?<\/td>/, newActions);

fs.writeFileSync("frontend/src/app/crm/customers/page.tsx", content);

