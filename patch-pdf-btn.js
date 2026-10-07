const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

const targetButton = `<Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>`;
const replacementButton = `<Button variant="outline" onClick={() => {
        const token = localStorage.getItem("erp_token");
        window.open(\`\${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/purchase-orders/\${details.id}/pdf?token=\${token}\`, "_blank");
      }}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>`;

if (code.includes(targetButton)) {
  code = code.replace(targetButton, replacementButton);
} else {
  // If it was already patched with my previous attempt:
  const prevPatch = `<Button variant="outline" onClick={() => window.open(\`/api/documents/purchase-orders/\${details.id}/pdf\`, '_blank')}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>`;
  if (code.includes(prevPatch)) {
    code = code.replace(prevPatch, replacementButton);
  }
}

fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched Export PDF button with token logic');
