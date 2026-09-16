const fs = require('fs');
const path = 'src/app/settings/warehouse/page.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/catch \(e\) \{\s*alert\("Gagal menghapus gudang"\)\s*\}/, 
  'catch (e: any) { alert(e.response?.data?.message || e.message || "Gagal menghapus gudang") }');
fs.writeFileSync(path, content, 'utf8');
