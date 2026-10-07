import re

with open("frontend/src/app/sales/orders/page.tsx", "r") as f:
    content = f.read()

# Add activeWarehouse state
state_code = """
 const [data, setData] = useState<any[]>([])
 const [activeWarehouse, setActiveWarehouse] = useState<any>(null)
"""
content = content.replace(' const [data, setData] = useState<any[]>([])', state_code)

# Replace useEffect and fetchOrders
old_effect = """ useEffect(() => {
 fetchOrders()
 }, [])

 const fetchOrders = async () => {
 try {
 const res = await B2BApi.getOrders({ page: 1, limit: 100 })"""

new_effect = """ useEffect(() => {
   const handleWhChange = () => {
     const stored = localStorage.getItem('active_warehouse');
     if (stored) {
       const parsed = JSON.parse(stored);
       setActiveWarehouse(parsed.id === 'ALL' ? null : parsed);
     } else {
       setActiveWarehouse(null);
     }
   };
   handleWhChange();
   window.addEventListener('warehouse_changed', handleWhChange);
   return () => window.removeEventListener('warehouse_changed', handleWhChange);
 }, []);

 useEffect(() => {
   fetchOrders();
 }, [activeWarehouse]);

 const fetchOrders = async () => {
   try {
     setLoading(true);
     const params: any = { page: 1, limit: 100 };
     if (activeWarehouse && activeWarehouse.id && activeWarehouse.id !== 'ALL') {
       params.warehouse_id = activeWarehouse.id;
     }
     const res = await B2BApi.getOrders(params)"""
     
content = content.replace(old_effect, new_effect)

with open("frontend/src/app/sales/orders/page.tsx", "w") as f:
    f.write(content)
print("Patched frontend")
