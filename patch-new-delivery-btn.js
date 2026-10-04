const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/sales/deliveries/page.tsx', 'utf8');
c = c.replace(
  /<Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" \/> New Delivery<\/Button>/,
  `<Link href="/sales/deliveries/create"><Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Delivery</Button></Link>`
);
// Make sure Link is imported
if (!c.includes('import Link')) {
  c = c.replace(/import { Plus, Search, FileText, ArrowRight } from 'lucide-react'/, "import { Plus, Search, FileText, ArrowRight } from 'lucide-react'\nimport Link from 'next/link'");
}
fs.writeFileSync('frontend/src/app/sales/deliveries/page.tsx', c);
