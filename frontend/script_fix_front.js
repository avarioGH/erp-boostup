const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Fix raw regex replacing backticks
  // e.g. /sales/deliveries/$id/validate
  code = code.replace(/\(\/([a-zA-Z0-9_/-]+)\/\$([a-zA-Z0-9_]+)(\/[a-zA-Z0-9_/-]+)?\/\)/g, '(`/$1/${$2}$3`)');
  code = code.replace(/\(\/([a-zA-Z0-9_/-]+)\/\$([a-zA-Z0-9_]+)\)/g, '(`/$1/${$2}`)');
  code = code.replace(/\(\/([a-zA-Z0-9_/-]+)\/\s*\+\s*([a-zA-Z0-9_]+)\s*\+\s*\/([a-zA-Z0-9_/-]+)\)/g, '(`/$1/${$2}/$3`)');
  code = code.replace(/\(\/([a-zA-Z0-9_/-]+)\/\s*\+\s*([a-zA-Z0-9_]+)\s*\+\s*\/([a-zA-Z0-9_/-]+),\s*data\)/g, '(`/$1/${$2}/$3`, data)');
  code = code.replace(/\(\/([a-zA-Z0-9_/-]+)\/\s*\+\s*([a-zA-Z0-9_]+)\)/g, '(`/$1/${$2}`)');
  code = code.replace(/api\.post\(\/([a-zA-Z0-9_/-]+)\/\s*\+\s*([a-zA-Z0-9_]+)\s*\+\s*\/([a-zA-Z0-9_/-]+)\)/g, 'api.post(`/$1/${$2}/$3`)');

  fs.writeFileSync(file, code);
}

fixFile('frontend/src/lib/api.ts');
fixFile('frontend/src/app/inventory/adjustments/page.tsx');
fixFile('frontend/src/app/inventory/transfers/page.tsx');

