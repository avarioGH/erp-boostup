const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/app-sidebar.tsx', 'utf8');

content = content.replace(/\{settings\.filter\(item => \{[\s\S]*?\}\)\.map\(\(item\) => \{/, 
`{settings.filter(item => {
 const username = user?.username?.toLowerCase() || '';
 if (username === 'kayu' || username === 'owner_kayu' || user?.company?.name?.toLowerCase().includes('kayu')) {
   return false; // Sembunyikan settings
 }

 if (!item.id || user?.role === 'Owner') return true;
 return user?.accessible_modules?.includes(item.id);
 }).map((item) => {`);

fs.writeFileSync('frontend/src/components/app-sidebar.tsx', content);
