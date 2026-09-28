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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src/app');
const selectRegex = /<SelectItem.*?>(.*?)<\/SelectItem>/gs;
const selectRegexLine = /<SelectItem.*?>.*?<\/SelectItem>/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = selectRegexLine.exec(content)) !== null) {
      if (match[0].includes(".id}") && !match[0].includes("name") && !match[0].includes("code") && !match[0].includes("sku")) {
         console.log(`[ID LABEL DETECTED] ${file}: ${match[0]}`);
      } else if (match[0].includes("Select")) {
         // console.log(`[OK] ${file}: ${match[0]}`);
      }
  }
  
  // Also check for <option>
  const optionRegex = /<option.*?>.*?<\/option>/g;
  while ((match = optionRegex.exec(content)) !== null) {
      if (match[0].includes(".id}") && !match[0].includes("name") && !match[0].includes("code") && !match[0].includes("sku")) {
         console.log(`[ID LABEL DETECTED OPTION] ${file}: ${match[0]}`);
      }
  }
});
