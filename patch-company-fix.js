const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

// I accidentally replaced the wrong thing or didn't replace it correctly.
// Let's find model Company and add exportShipments ExportShipment[] inside it.
const companyRegex = /model Company \{([\s\S]*?)\}/;
const match = schema.match(companyRegex);
if (match) {
  let inside = match[1];
  if (!inside.includes('exportShipments ExportShipment[]')) {
    inside = inside + '\n  exportShipments ExportShipment[]\n';
    schema = schema.replace(companyRegex, 'model Company {' + inside + '}');
    fs.writeFileSync(path, schema, 'utf8');
    console.log("Fixed Company relation manually.");
  }
}
