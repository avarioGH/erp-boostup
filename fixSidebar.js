const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/app-sidebar.tsx', 'utf8');

// The original string is: { title: "AP Payments", url: "/finance/ap-payments" }
content = content.replace(/,\s*\{\s*title:\s*"AP Payments",\s*url:\s*"\/finance\/ap-payments"\s*\}/, '');

fs.writeFileSync('frontend/src/components/app-sidebar.tsx', content);
console.log('Fixed app-sidebar.tsx');
