const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx') || file.endsWith('.jsx')) results.push(file);
  });
  return results;
}

const files = walk('frontend/src/app');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Replace {w.name || w.code || w.id} -> {w.name || w.code || 'Unnamed Warehouse'}
  content = content.replace(/\{(\w+)\.name\s*\|\|\s*(\w+)\.code\s*\|\|\s*\1\.id\}/g, (match, p1, p2) => `{${p1}.name || ${p1}.code || 'Unnamed Entity'}`);
  
  // Replace {s.bundleNumber || s.id} -> {s.bundleNumber || 'Unnamed Bundle'}
  content = content.replace(/\{(\w+)\.bundleNumber\s*\|\|\s*\1\.id\}/g, (match, p1) => `{${p1}.bundleNumber || 'Unnamed Bundle'}`);

  // Replace {s.name || s.id} -> {s.name || 'Unnamed Source'}
  content = content.replace(/\{(\w+)\.name\s*\|\|\s*\1\.id\}/g, (match, p1) => `{${p1}.name || 'Unnamed Entity'}`);

  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log("Patched: " + f);
  }
});
