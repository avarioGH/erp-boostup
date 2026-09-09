const fs = require('fs');

function replaceFile(path, search, replace) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(path, content, 'utf8');
  }
}

replaceFile('frontend/src/app/crm/customers/[id]/page.tsx', /api\.get\(\/crm\/customers\\\/360\)/, "api.get('/crm/customers/' + params.id + '/360')");
replaceFile('frontend/src/app/crm/customers/[id]/page.tsx', /api\.get\(\/crm\/customers\/\\\/\+params\.id\+\\\/360\)/, "api.get('/crm/customers/' + params.id + '/360')");
replaceFile('frontend/src/app/manufacturing/quality/page.tsx', /\{c\.work_order && \\ \/ \\\}/, "{c.work_order && ' / '}");
replaceFile('frontend/src/app/manufacturing/quality/page.tsx', /className=\{\\px-2 py-1 rounded text-xs font-semibold \\\}/, "className='px-2 py-1 rounded text-xs font-semibold'");
replaceFile('frontend/src/app/purchasing/analytics/page.tsx', /import \{ formatCurrency \} from '@\/lib\/utils';/, "import { formatIDR as formatCurrency } from '@/lib/utils';");
replaceFile('frontend/src/app/purchasing/orders/[id]/page.tsx', /import \{ formatCurrency \} from '@\/lib\/utils';/, "import { formatIDR as formatCurrency } from '@/lib/utils';");

console.log('Fixed');
