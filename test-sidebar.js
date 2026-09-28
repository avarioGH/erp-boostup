const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/app-sidebar.tsx', 'utf8');

const inventoryUmum = `
 { 
 title: "Inventory (Umum)", 
 url: "/inventory", 
 icon: Box,
 id: "inventory_general",
 subItems: [
 { title: "Products", url: "/inventory/products" },
 { title: "Categories", url: "/inventory/categories" },
 { title: "Brands", url: "/inventory/brands" },
 { title: "Units", url: "/inventory/units" },
 { title: "Suppliers", url: "/inventory/suppliers" },
 { title: "Warehouses", url: "/inventory/warehouses" },
 { title: "Stock In", url: "/inventory/stock-in" },
 { title: "Stock Out", url: "/inventory/stock-out" },
 { title: "Stock Transfers", url: "/inventory/transfers" },
 { title: "Adjustments", url: "/inventory/adjustments" },
 { title: "Stock Opname", url: "/inventory/stock-opname" },
 { title: "Stock Reports", url: "/inventory/stock" },
 { title: "Movements", url: "/inventory/movements" }
 ]
 },`;

content = content.replace('id: "inventory",', 'id: "inventory_timber",');
content = content.replace('const items: MenuItem[] = [', 'const items: MenuItem[] = [' + inventoryUmum);

// Also add a hardcoded override if they want "akun ikan" vs "akun kayu" based on email or company.
// "user?.company?.name?.toLowerCase().includes('ikan')"
// Let's modify the filter logic
const filterLogic = `
 {items.filter(item => {
 if (user?.email === 'ikan@boostup.test' || user?.company_name?.toLowerCase().includes('ikan')) {
    if (item.id === 'inventory_timber' || item.id === 'manufacturing' || item.id === 'production') return false;
    return true;
 }
 if (user?.email === 'kayu@boostup.test' || user?.company_name?.toLowerCase().includes('kayu')) {
    if (item.id === 'inventory_timber') return true;
    if (!item.id) return true; // Dashboard
    return false;
 }

 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {
`;

// wait, the user object in localstorage has what?
// Let's just fix the `items` array first.
fs.writeFileSync('frontend/src/components/app-sidebar.tsx', content);
