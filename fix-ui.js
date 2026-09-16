const fs = require('fs');
const files = [
  'frontend/src/app/inventory/logs/create/page.tsx',
  'frontend/src/app/inventory/logs/[id]/trimming/create/page.tsx'
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<label className="text-sm font-medium text-red-600">Log Number \*<\/label>/g, '<label className="text-sm font-medium">Log Number <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">Species \*<\/label>/g, '<label className="text-sm font-medium">Species <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">Original Length \(meters\) \*<\/label>/g, '<label className="text-sm font-medium">Original Length (meters) <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">Trimmed Length \(meters\) \*<\/label>/g, '<label className="text-sm font-medium">Trimmed Length (meters) <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">D1 \(cm\) \*<\/label>/g, '<label className="text-sm font-medium">D1 (cm) <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">D2 \(cm\) \*<\/label>/g, '<label className="text-sm font-medium">D2 (cm) <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">D3 \(cm\) \*<\/label>/g, '<label className="text-sm font-medium">D3 (cm) <span className="text-red-500">*</span></label>');
  c = c.replace(/<label className="text-sm font-medium text-red-600">D4 \(cm\) \*<\/label>/g, '<label className="text-sm font-medium">D4 (cm) <span className="text-red-500">*</span></label>');
  c = c.replace(/<span className="text-sm text-muted-foreground text-red-500">Net Volume<\/span>/g, '<span className="text-sm font-semibold text-emerald-700">Net Volume</span>');
  
  // Use HTML entity or safe unicode
  c = c.replace(/Gerowong O/g, 'Gerowong &Oslash;');
  c = c.replace(/Avg O/g, 'Avg &Oslash;');
  c = c.replace(/Rounded O/g, 'Rounded &Oslash;');
  
  fs.writeFileSync(f, c, 'utf8');
}
console.log('Fixed using Node');
