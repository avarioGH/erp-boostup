const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/logs/page.tsx', 'utf-8');

code = code.replace(
  /const getStatusBadge = \(status: string\) => \{[\s\S]*?^\s*\}\n \}/m,
  `const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === 'AVAILABLE' || s === 'CONFIRMED') return <span className="inline-flex items-center rounded-sm bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success-foreground uppercase tracking-wider">{s}</span>;
    if (s === 'IN_TRIMMING') return <span className="inline-flex items-center rounded-sm bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-warning-foreground uppercase tracking-wider">{s.replace('_', ' ')}</span>;
    if (s === 'CANCELLED') return <span className="inline-flex items-center rounded-sm bg-destructive/15 px-2 py-0.5 text-[11px] font-bold text-destructive uppercase tracking-wider">{s}</span>;
    return <span className="inline-flex items-center rounded-sm bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary uppercase tracking-wider">{s}</span>;
  }`
);

fs.writeFileSync('frontend/src/app/inventory/logs/page.tsx', code);
console.log('Fixed extra brace in logs/page.tsx');
