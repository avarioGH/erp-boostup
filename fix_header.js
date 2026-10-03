const fs = require("fs");
let content = fs.readFileSync("frontend/src/components/app-header.tsx", "utf8");
content = content.replace("export function AppHeader() {\n const router = useRouter()\n const [user, setUser] = useState<any>(null)\n const [activeWarehouse, setActiveWarehouse] = useState<any>(null)\n const [warehouses, setWarehouses] = useState<any[]>([])\n\n useEffect(() => {", 
`export function AppHeader() {
 const router = useRouter()
 const [user, setUser] = useState<any>(null)
 const [activeWarehouse, setActiveWarehouse] = useState<any>(null)
 const [warehouses, setWarehouses] = useState<any[]>([])

 const fetchWarehouses = () => {
    api.get("/inventory/warehouses").then(res => {
      if (res.data) setWarehouses(res.data)
    }).catch(err => console.error("Error fetching warehouses", err))
 }

 useEffect(() => {`);

fs.writeFileSync("frontend/src/components/app-header.tsx", content);

