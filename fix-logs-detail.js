const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/logs/[id]/page.tsx', 'utf-8');

// Container
code = code.replace(
  /<div className="space-y-6 pb-10 animate-in fade-in duration-300">/,
  '<div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Header padding & layout
code = code.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 gap-4 border-b pb-4">/,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">'
);

// Title styling
code = code.replace(
  /text-3xl font-bold tracking-tight text-emerald-800/,
  'text-2xl font-bold tracking-tight text-foreground'
);

// Card visual adjustments
code = code.replace(/<Card className="shadow-sm border-border">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');
code = code.replace(/<Card className="shadow-sm">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');

code = code.replace(/<CardHeader className="border-b bg-muted\/10 pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');
code = code.replace(/<CardHeader className="border-b bg-muted\/10 pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');
code = code.replace(/<CardHeader className="border-b pb-4 flex flex-row items-center justify-between">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">');

// Text color changes
code = code.replace(/text-emerald-500/g, 'text-success');
code = code.replace(/text-amber-500/g, 'text-warning');
code = code.replace(/text-blue-700/g, 'text-primary/90');

fs.writeFileSync('frontend/src/app/inventory/logs/[id]/page.tsx', code);
console.log('Log Kayu (Detail) updated');
