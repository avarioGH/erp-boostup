const fs = require('fs');
const path = 'frontend/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLogic = `const isKayu = userName.includes('kayu') || user?.accessible_modules?.includes('inventory');`;
const newLogic = `const isKayu = userName.includes('kayu'); // Strict check for kayu user only`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Patched page.tsx redirect logic successfully.");
} else {
  console.log("Could not find the target logic to patch.");
}
