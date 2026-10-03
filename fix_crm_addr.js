const fs = require('fs');
let r = fs.readFileSync('frontend/src/app/crm/customers/page.tsx', 'utf8');

// The closing pattern: </div>\r\n </div>\r\n <div className="flex justify-end
// Note: single space indent
const closePattern = '</div>\r\n </div>\r\n <div className="flex justify-end';
const idx = r.indexOf(closePattern);

if (idx < 0) {
  // Try with different whitespace
  console.log('Not found. Showing area after email...');
  const eIdx = r.indexOf('Email Address');
  console.log(JSON.stringify(r.substring(eIdx + 50, eIdx + 250)));
  process.exit(1);
}

const addressField = '\r\n <div className="space-y-2 md:col-span-2">\r\n <Label>Alamat / Address</Label>\r\n <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Sudirman No. 1, Jakarta..." />\r\n </div>';

const insertAt = idx + '</div>\r\n </div>'.length;
r = r.substring(0, insertAt) + addressField + r.substring(insertAt);

fs.writeFileSync('frontend/src/app/crm/customers/page.tsx', r);
console.log(r.includes('Alamat / Address') ? 'SUCCESS' : 'FAILED');
