const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

if (!code.includes('useSearchParams')) {
  code = code.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\nimport { useSearchParams } from 'next/navigation'");
  
  const target = 'const [docLoading, setDocLoading] = useState(false)';
  const injection = `const [docLoading, setDocLoading] = useState(false)
  const searchParams = useSearchParams()
  const poId = searchParams.get('id')
  
  useEffect(() => {
    if (poId && data.length > 0) {
      const doc = data.find((d: any) => d.id === poId)
      if (doc && !selectedDoc) {
        viewDetails(doc)
      }
    }
  }, [poId, data])`;
  
  code = code.replace(target, injection);
  fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
  console.log('patched purchasing/orders/page.tsx');
}
