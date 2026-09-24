const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/purchase/page.tsx', 'utf-8');

// Update spacing and container sizing
code = code.replace(
  /<div className="space-y-6 max-w-\[1400px\] mx-auto animate-in fade-in duration-500">/,
  '<div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Update Page Header padding and mobile sizing
code = code.replace(
  /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">/,
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">'
);

code = code.replace(
  /<h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">/,
  '<h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">'
);

code = code.replace(
  /<Link href="\/inventory\/purchase\/create">/,
  '<Link href="/inventory/purchase/create" className="w-full sm:w-auto">'
);

code = code.replace(
  /<Button className="shadow-sm font-semibold tracking-wide">/,
  '<Button className="w-full sm:w-auto shadow-sm font-semibold tracking-wide">'
);

// Table overflow scrolling
code = code.replace(
  /<div className="overflow-x-auto">/,
  '<div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">'
);

code = code.replace(
  /<Table>/,
  '<Table className="w-full min-w-[600px]">'
);

// Update table header style
code = code.replace(
  /<TableHeader className="bg-muted\/40">/,
  '<TableHeader className="bg-muted/30 border-b border-border">'
);

fs.writeFileSync('frontend/src/app/inventory/purchase/page.tsx', code);
console.log('Purchase page mobile responsive fixed.');
