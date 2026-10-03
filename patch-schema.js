const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// 1. Rename Supplier to Partner (or delete Supplier and rename Customer)
// Let's delete the entire Supplier model block.
const supplierRegex = /model Supplier \{[\s\S]*?\}\n/g;
schema = schema.replace(supplierRegex, '');

// 2. Rename Customer to Partner
schema = schema.replace(/model Customer \{/g, 'model Partner {');

// 3. Rename references to Supplier/Customer in other models
schema = schema.replace(/supplier\s+Supplier\?/g, 'supplier Partner?');
schema = schema.replace(/supplier\s+Supplier/g, 'supplier Partner');
schema = schema.replace(/customer\s+Customer\?/g, 'customer Partner?');
schema = schema.replace(/customer\s+Customer/g, 'customer Partner');

// 4. Update the Partner model to include Roles and mapped to customers
schema = schema.replace(/model Partner \{/, `model Partner {\n  roles String[] @default(["CUSTOMER"])`);

// 5. Update foreign keys (customer_id -> partner_id, supplier_id -> partner_id) in the schema?
// WAIT, renaming fields in Prisma means the database column name changes unless we use @map.
// If I use @map("customer_id") then the DB is untouched.
// Let's just keep the field names as `customer_id` and `supplier_id` in other tables for now, 
// but point BOTH of them to the Partner model! 
// This avoids rewriting thousands of lines of API responses if we just point them to Partner!

fs.writeFileSync('backend/prisma/schema.prisma', schema);
console.log('Schema updated.');
