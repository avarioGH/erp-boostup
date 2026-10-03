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
      if (file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('backend/src');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace prisma models
  content = content.replace(/prisma\.supplier/g, 'prisma.customer');
  
  // Note: we might have Types like Supplier that need to be replaced with Customer
  // Let's replace 'Supplier' with 'Customer' in contexts where it refers to the Prisma model
  content = content.replace(/Supplier([^\w])/g, 'Customer$1');
  content = content.replace(/supplier([^\w])/g, 'customer$1'); // Be careful, this replaces variable names too, which is usually fine if they match the model.

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
  }
});

console.log('Replaced in ' + count + ' backend files.');
