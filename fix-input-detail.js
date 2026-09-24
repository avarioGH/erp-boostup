const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/input-logs/[id]/page.tsx', 'utf-8');

// Container
code = code.replace(
  /<div className="space-y-6 pb-10">/,
  '<div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Header padding
code = code.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 gap-4 border-b pb-4">/,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">'
);

// Title styling
code = code.replace(
  /text-3xl font-bold tracking-tight text-indigo-900/,
  'text-2xl font-bold tracking-tight text-foreground'
);
code = code.replace(
  /\? \{data\.species\}/,
  '• {data.species}'
);

// Cards visual adjustments
code = code.replace(/<Card className="shadow-sm border-indigo-100">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');
code = code.replace(/<Card className="shadow-sm">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');

code = code.replace(/<CardHeader className="border-b bg-muted\/10 pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');
code = code.replace(/<CardHeader className="border-b bg-indigo-50\/50 pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');
code = code.replace(/<CardHeader className="border-b pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');

// Text color changes
code = code.replace(/text-indigo-800/g, 'text-foreground');
code = code.replace(/text-indigo-900/g, 'text-foreground font-bold');
code = code.replace(/border-indigo-100/g, 'border-border/50');
code = code.replace(/border-indigo-200/g, 'border-primary/20');
code = code.replace(/bg-indigo-50/g, 'bg-primary/5');

// Table scrolling constraint for Mobile
code = code.replace(
  /<div className="overflow-x-auto">/,
  '<div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">'
);

fs.writeFileSync('frontend/src/app/inventory/input-logs/[id]/page.tsx', code);
console.log('Input Logs Detail updated');
