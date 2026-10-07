const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

if (!code.includes('useSearchParams } from')) {
  code = code.replace(
    "import { useRouter } from 'next/navigation'",
    "import { useRouter, useSearchParams } from 'next/navigation'"
  );
  fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
  console.log('patched useSearchParams import');
}
