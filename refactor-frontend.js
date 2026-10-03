const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('frontend/src');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replaces
  content = content.replace(/customer_id/g, 'partner_id');
  content = content.replace(/customerId/g, 'partnerId');
  content = content.replace(/supplier_id/g, 'partner_id');
  content = content.replace(/supplierId/g, 'partnerId');

  // Customer -> Partner endpoints
  content = content.replace(/\/crm\/customers/g, '/crm/partners');
  content = content.replace(/getCustomer360/g, 'getPartner360');
  content = content.replace(/getCustomers/g, 'getPartners');
  content = content.replace(/createCustomer/g, 'createPartner');
  content = content.replace(/updateCustomer/g, 'updatePartner');

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Updated', file);
  }
});

console.log('Total files updated:', count);
