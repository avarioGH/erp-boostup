const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'src', 'app');
const routes = [];

function walk(dir, currentRoute) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('[')) continue; // skip dynamic routes for bulk smoke test
      if (entry.name.startsWith('(')) {
        walk(path.join(dir, entry.name), currentRoute);
      } else {
        walk(path.join(dir, entry.name), currentRoute + '/' + entry.name);
      }
    } else if (entry.name === 'page.tsx') {
      routes.push(currentRoute === '' ? '/' : currentRoute);
    }
  }
}

walk(appDir, '');
console.log(JSON.stringify(routes, null, 2));
