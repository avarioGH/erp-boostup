const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Replace any remaining "Supplier?" or "Supplier[]" or "Supplier "
schema = schema.replace(/suppliers\s+Supplier\[\]/g, 'suppliers       Customer[]');
schema = schema.replace(/supplier\s+Supplier\?/g, 'supplier                  Customer?');
schema = schema.replace(/supplier\s+Supplier\b/g, 'supplier          Customer');

// Let's use a more robust regex for all 'Supplier' as type:
// This looks for any field type declaration of Supplier, Supplier?, or Supplier[]
schema = schema.replace(/(\w+\s+)Supplier(\[\]|\?|)(.*?)/g, '$1Customer$2$3');

fs.writeFileSync('backend/prisma/schema.prisma', schema);
console.log('Fixed remaining Supplier references.');
