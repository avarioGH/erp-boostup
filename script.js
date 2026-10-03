
const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf8');

content = content.replace(
  'localStorage.setItem("active_warehouse", JSON.stringify(wh))',
  'localStorage.setItem("active_warehouse", JSON.stringify(wh)); window.dispatchEvent(new Event("warehouse_changed"));'
);

content = content.replace(
  'localStorage.setItem("active_warehouse", JSON.stringify(null))',
  'localStorage.setItem("active_warehouse", JSON.stringify(null)); window.dispatchEvent(new Event("warehouse_changed"));'
);

fs.writeFileSync('frontend/src/components/app-header.tsx', content);

