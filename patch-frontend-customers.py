import re

with open("frontend/src/app/crm/partners/page.tsx", "r") as f:
    content = f.read()

# Add activeWarehouse state
state_code = """
 const [customers, setCustomers] = useState<any[]>([])
 const [activeWarehouse, setActiveWarehouse] = useState<any>(null)
"""
content = content.replace(' const [customers, setCustomers] = useState<any[]>([])', state_code)

# Add warehouse listener effect
effect_code = """ useEffect(() => {
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
 fetchCustomers()
 }, [page, limit, search, status, activeWarehouse])"""
 
content = content.replace(""" useEffect(() => {
 fetchCustomers()
 }, [page, limit, search, status])""", effect_code)

# Replace fetch logic
old_fetch = """ const res = await api.get(`/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`)"""
new_fetch = """ let url = `/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${status}`;
 if (activeWarehouse && activeWarehouse.id && activeWarehouse.id !== 'ALL') {
   url += `&warehouse_id=${activeWarehouse.id}`;
 }
 const res = await api.get(url)"""
content = content.replace(old_fetch, new_fetch)

# Add warehouse_id to creation
old_save = """         await api.post(`/customers`, { name, phone, email, address });"""
new_save = """         await api.post(`/customers`, { name, phone, email, address, warehouse_id: activeWarehouse?.id && activeWarehouse?.id !== 'ALL' ? activeWarehouse.id : undefined });"""
content = content.replace(old_save, new_save)

with open("frontend/src/app/crm/partners/page.tsx", "w") as f:
    f.write(content)
print("Patched CRM partners frontend")
