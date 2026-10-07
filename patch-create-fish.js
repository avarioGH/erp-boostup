const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');

if (!code.includes('useSearchParams')) {
  code = code.replace("import React, { useState, useEffect } from 'react'", "import React, { useState, useEffect } from 'react'\nimport { useSearchParams } from 'next/navigation'");
  
  const target = `  const [formData, setFormData] = useState({
    partner_id: "",`;
    
  const replacement = `  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialPartnerId = searchParams?.get('partner_id') || "";

  const [formData, setFormData] = useState({
    partner_id: initialPartnerId,`;
    
  // Since we might be inside a component, useSearchParams from next/navigation might need Suspense.
  // Using window.location.search is safer if we don't want to deal with Suspense boundaries.
  // Actually, wait, let's just use window.location.search directly in useState initialization.
  
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', code);
  console.log('patched fish purchase create to accept partner_id');
}
