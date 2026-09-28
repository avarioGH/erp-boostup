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

if (!content.includes('id: "inventory_general"')) {
    content = content.replace('id: "inventory",', 'id: "inventory_timber",');
    content = content.replace('const items: MenuItem[] = [', 'const items: MenuItem[] = [' + inventoryUmum);
}

const filterOld = ` {items.filter(item => {
 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`;

const filterNew = ` {items.filter(item => {
 // HARDCODED TENANT ISOLATION UNTUK AKUN IKAN & KAYU
 const username = user?.username?.toLowerCase();
 if (username === 'ikan' || username === 'owner_ikan') {
   if (item.id === 'inventory_timber' || item.id === 'production' || item.id === 'manufacturing') return false;
   return true;
 }
 if (username === 'kayu' || username === 'owner_kayu') {
   if (item.id === 'inventory_timber' || item.id === 'production') return true;
   if (!item.id) return true; // Dashboard
   return false; 
 }

 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`;

if (content.includes(filterOld)) {
    content = content.replace(filterOld, filterNew);
}

// Check Settings
const settingsOld = ` {settings.filter(item => {
 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`;

const settingsNew = ` {settings.filter(item => {
 const username = user?.username?.toLowerCase();
 if (username === 'kayu' || username === 'owner_kayu') return false; // Sembunyikan settings utk kayu jika hanya boleh inventory
 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`;

if (content.includes(settingsOld)) {
    content = content.replace(settingsOld, settingsNew);
}

fs.writeFileSync('frontend/src/components/app-sidebar.tsx', content);
