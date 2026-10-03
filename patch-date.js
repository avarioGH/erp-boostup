const fs = require('fs');

function fixDate(filePath, dateField) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace new Date().toISOString().split('T')[0] with a local timezone aware snippet
  const badDateRegex = /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g;
  
  // This gets the YYYY-MM-DD in the local timezone instead of UTC
  const goodDateString = "new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]";
  
  if (content.match(badDateRegex)) {
    content = content.replace(badDateRegex, goodDateString);
    fs.writeFileSync(filePath, content);
    console.log('Fixed date in ' + filePath);
  }
}

fixDate('frontend/src/app/sales/orders/create/page.tsx', 'order_date');
fixDate('frontend/src/app/inventory/inflow/tambah/page.tsx', 'tally_date');
// Any other common ones?
