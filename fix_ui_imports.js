const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/finance/accounting-periods/page.tsx', 'utf8');

// Fix api import
content = content.replace("import api from '@/lib/api';", "import { api } from '@/lib/api';");

// Fix date-fns
content = content.replace("import { format } from 'date-fns';", "");
content = content.replace(/\{format\(new Date\(p\.start_date\), 'MMM d, yyyy'\)\}/g, "{new Date(p.start_date).toLocaleDateString()}");
content = content.replace(/\{format\(new Date\(p\.end_date\), 'MMM d, yyyy'\)\}/g, "{new Date(p.end_date).toLocaleDateString()}");
content = content.replace(/\{format\(new Date\(p\.closed_at\), 'MMM d'\)\}/g, "{new Date(p.closed_at).toLocaleDateString()}");

fs.writeFileSync('frontend/src/app/finance/accounting-periods/page.tsx', content, 'utf8');
