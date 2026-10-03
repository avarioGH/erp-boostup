const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

content = content.replace("import { InventoryAPI, PosAPI } from \"@/lib/api\"", "import { InventoryAPI, PosAPI, api } from \"@/lib/api\"");

const statesToInsert = `  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  
  useEffect(() => {
     api.get("/customers?limit=100").then(res => {
         if (res.data?.data) setCustomers(res.data.data)
     }).catch(console.error)
  }, [])
`;

content = content.replace("const [isCheckingOut, setIsCheckingOut] = useState(false)", statesToInsert + "\n  const [isCheckingOut, setIsCheckingOut] = useState(false)");

fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

