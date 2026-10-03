const fs = require('fs');
const files = [
  'frontend/src/app/inventory/inflow/tambah/page.tsx',
  'frontend/src/app/sales/orders/create/page.tsx',
  'frontend/src/app/sales/quotations/create/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Inject getDisplay function right inside SearchableSelect
  const searchFor = 'const selectedOption = options?.find((o: any) => o.id === value || o._id === value)';
  const replaceWith = `
  const getDisplay = (o: any) => {
    if (!o) return "";
    let text = o.name || o.code || "";
    // Jika ada nomor HP, tambahkan di sebelah nama
    if (o.phone) text += \` (\${o.phone})\`;
    // Jika ada kode dan BUKAN kode auto-generate panjang (CUST-/SUP-), tampilkan kodenya (misal untuk Produk)
    else if (o.code && !o.code.startsWith('CUST-') && !o.code.startsWith('SUP-') && !o.code.startsWith('VEND-')) {
      text = \`\${o.code} - \${text}\`;
    }
    return text;
  };
  const selectedOption = options?.find((o: any) => o.id === value || o._id === value)`;

  if (content.includes(searchFor) && !content.includes('const getDisplay')) {
    content = content.replace(searchFor, replaceWith);
  }

  // Replace displayValue logic
  content = content.replace(
    /const displayValue = open \? search : \(selectedOption \? \(selectedOption\.code \? `\$\{selectedOption\.code\} - \$\{selectedOption\.name\}` : selectedOption\.name\) : ""\)/,
    'const displayValue = open ? search : getDisplay(selectedOption)'
  );

  // Replace placeholder logic
  content = content.replace(
    /placeholder=\{selectedOption \? \(selectedOption\.code \? `\$\{selectedOption\.code\} - \$\{selectedOption\.name\}` : selectedOption\.name\) : \(placeholder \|\| "Pilih\.\.\."\)\}/,
    'placeholder={selectedOption ? getDisplay(selectedOption) : (placeholder || "Pilih...")}'
  );

  // Replace list rendering
  content = content.replace(
    /\{o\.code \? `\$\{o\.code\} - ` : ''\}\{o\.name\}/g,
    '{getDisplay(o)}'
  );

  fs.writeFileSync(file, content);
}
