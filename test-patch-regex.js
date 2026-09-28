const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/app-sidebar.tsx', 'utf8');

content = content.replace(/\{items\.filter\(item => \{[\s\S]*?\}\)\.map\(\(item\) => \{/, 
`{items.filter(item => {
 const username = user?.username?.toLowerCase() || '';
 
 if (username === 'ikan' || username === 'owner_ikan' || user?.company?.name?.toLowerCase().includes('ikan')) {
   if (item.id === 'inventory_timber' || item.id === 'production' || item.id === 'manufacturing') return false;
   return true;
 }
 
 if (username === 'kayu' || username === 'owner_kayu' || user?.company?.name?.toLowerCase().includes('kayu')) {
   if (item.id === 'inventory_timber' || item.id === 'production') return true;
   if (!item.id) return true; // Dashboard
   return false; 
 }

 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`);

fs.writeFileSync('frontend/src/components/app-sidebar.tsx', content);
