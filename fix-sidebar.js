const fs = require('fs');

function addWhatsapp(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /title: "Daftar Pelanggan", url: "\/crm\/partners" \},/,
    `title: "Daftar Pelanggan", url: "/crm/partners" },\n        { title: "WhatsApp Chat", url: "/crm/whatsapp" },`
  );
  fs.writeFileSync(file, content);
}

addWhatsapp('frontend/src/components/kayu-sidebar.tsx');
addWhatsapp('frontend/src/components/ikan-sidebar.tsx');
console.log('Added WhatsApp link to sidebars');
