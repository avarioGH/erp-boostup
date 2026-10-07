const fs = require('fs');
let content = fs.readFileSync('backend/src/inventory/inventory.service.ts', 'utf8');
const diag = fs.readFileSync('diag.ts', 'utf8');
if (!content.includes('getFifoDiagnostic')) {
  // insert before last closing brace
  const lastIndex = content.lastIndexOf('}');
  content = content.substring(0, lastIndex) + '\n' + diag + '\n}\n';
  fs.writeFileSync('backend/src/inventory/inventory.service.ts', content);
  console.log('Added to service');
} else {
  console.log('Already has getFifoDiagnostic');
}
