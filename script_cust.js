const fs = require('fs');
fs.writeFileSync('frontend/src/app/crm/customers/[id]/page.tsx', 'export default function Customer360Page() { return <div>Customer 360 (Overview, Sales, Activities)</div>; }');
