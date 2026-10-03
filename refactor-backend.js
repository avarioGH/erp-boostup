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
  content = content.replace(/prisma\.customer/g, 'prisma.partner');
  content = content.replace(/prisma\.supplier/g, 'prisma.partner');
  
  // Replace types
  content = content.replace(/Customer([^\w])/g, 'Partner$1');
  content = content.replace(/Supplier([^\w])/g, 'Partner$1');

  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
  }
});

console.log('Replaced in ' + count + ' backend files.');
