const fs = require('fs');
const path = require('path');

function fixDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const badDateRegex = /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g;
      if (content.match(badDateRegex)) {
        content = content.replace(badDateRegex, "new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]");
        fs.writeFileSync(fullPath, content);
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

fixDir('frontend/src/app');
