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
      if (file.endsWith('page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('frontend/src/app');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<Card>') && (content.includes('Data Utama') || content.includes('Informasi Utama') || content.includes('Rincian Ikan') || content.includes('Pembayaran & Piutang') || content.includes('Informasi Dasar'))) {
    content = content.replace(/<Card>/g, '<Card className="overflow-visible">');
    fs.writeFileSync(file, content);
    count++;
    console.log('Fixed', file);
  }
});
console.log('Fixed', count, 'files');
