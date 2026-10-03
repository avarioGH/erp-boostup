const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
const start = content.indexOf('<div className="hidden"><Select value={warehouse}');
const endSelect = content.indexOf('</Select>', start) + 9;
const before = content.substring(0, endSelect);
const after = content.substring(endSelect);
if (!before.endsWith('</div>')) {
  fs.writeFileSync('frontend/src/app/page.tsx', before + '</div>' + after);
}
