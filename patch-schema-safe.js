const fs = require('fs');

let lines = fs.readFileSync('backend/prisma/schema.prisma', 'utf8').split('\n');

// Delete Supplier model
let inSupplier = false;
let out = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.match(/^model Supplier\s*\{/)) {
    inSupplier = true;
    continue;
  }
  
  if (inSupplier) {
    if (line.match(/^\}/)) {
      inSupplier = false;
    }
    continue;
  }
  
  // Replace Supplier references with Customer
  line = line.replace(/suppliers\s+Supplier\[\]/, 'suppliers       Customer[]');
  
  // Replace references pointing to Supplier model -> Customer model
  if (line.match(/supplier\s+Supplier/)) {
    line = line.replace(/supplier\s+Supplier\?/, 'supplier          Customer?');
    line = line.replace(/supplier\s+Supplier\b/, 'supplier          Customer');
  }

  // Invoice ambiguous relations fix
  // If we are in Invoice model
  if (line.includes('customer       Customer?   @relation(fields: [customer_id]')) {
    line = line.replace('relation(fields: [customer_id]', 'relation("InvoiceCustomer", fields: [customer_id]');
  }
  if (line.includes('supplier          Customer?      @relation(fields: [supplier_id]')) {
    line = line.replace('relation(fields: [supplier_id]', 'relation("InvoiceSupplier", fields: [supplier_id]');
  }

  // Add the relation names to Customer
  if (line.includes('invoices          Invoice[]')) {
    line = '    invoices_as_customer Invoice[] @relation("InvoiceCustomer")\n    invoices_as_supplier Invoice[] @relation("InvoiceSupplier")';
  }

  // Add roles to Customer
  if (line.match(/^model Customer\s*\{/)) {
    out.push(line);
    out.push('    roles        String[]   @default(["CUSTOMER"])');
    continue;
  }

  out.push(line);
}

fs.writeFileSync('backend/prisma/schema.prisma', out.join('\n'));
console.log('Clean schema generated.');
