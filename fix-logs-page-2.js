const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/logs/page.tsx', 'utf-8');

// Container
code = code.replace(
  '<div className="space-y-6 pb-10">',
  '<div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Header padding
code = code.replace(
  '<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">',
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">'
);

// Title styling
code = code.replace(
  '<h1 className="text-[28px] font-bold tracking-tight text-foreground">Raw Logs (DUKB)</h1>',
  '<h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"><Package className="w-6 h-6 text-primary" /> Log Kayu (DUKB)</h1>'
);
code = code.replace(
  '<p className="text-muted-foreground mt-1">Master registry of individual raw timber logs.</p>',
  '<p className="text-sm text-muted-foreground max-w-2xl">Penerimaan kayu bulat dari supplier dan sumber material.</p>'
);

// Button styling
code = code.replace(
  '<Button onClick={() => router.push(\'/inventory/logs/create\')} className="">',
  '<Button onClick={() => router.push(\'/inventory/logs/create\')} className="w-full sm:w-auto shadow-sm font-semibold tracking-wide">'
);

// Table Card
code = code.replace(
  '<Card className="shadow-sm">',
  '<Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">'
);
code = code.replace(
  '<CardHeader className="pb-4 border-b border-border/40">',
  '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">'
);
code = code.replace(
  '<CardTitle className="text-[16px] font-semibold">Log Inventory</CardTitle>',
  '<CardTitle className="text-base font-bold">Data Log Kayu</CardTitle>'
);

// Search styling
code = code.replace(
  '<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />',
  '<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />'
);
code = code.replace(
  '<Input type="search" placeholder="Search log no, barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />',
  '<Input type="search" placeholder="Search log no, barcode..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />'
);
code = code.replace(
  '<Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full sm:w-[150px]" />',
  '<Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full sm:w-[150px] bg-background" />'
);

// Table scrolling constraint for Mobile
code = code.replace(
  '<div className="overflow-x-auto">',
  '<div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">'
);

// Table styling
code = code.replace(
  '<thead className="bg-muted border-y border-border">',
  '<thead className="bg-muted/30 border-b border-border">'
);
code = code.replace(/text-\[\#526174\] font-semibold text-\[13px\] tracking-wide/g, 'font-semibold text-muted-foreground h-11');
code = code.replace(/<td className="py-3\.5 px-6/g, '<td className="py-3 px-6');
code = code.replace(/text-primary text-\[13px\]/g, 'text-foreground/90');

// Status Badge
code = code.replace(
  /const getStatusBadge = \(s: string\) => \{[\s\S]*?^\s*\}/m,
  `const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === 'AVAILABLE' || s === 'CONFIRMED') return <span className="inline-flex items-center rounded-sm bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success-foreground uppercase tracking-wider">{s}</span>;
    if (s === 'IN_TRIMMING') return <span className="inline-flex items-center rounded-sm bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-warning-foreground uppercase tracking-wider">{s.replace('_', ' ')}</span>;
    if (s === 'CANCELLED') return <span className="inline-flex items-center rounded-sm bg-destructive/15 px-2 py-0.5 text-[11px] font-bold text-destructive uppercase tracking-wider">{s}</span>;
    return <span className="inline-flex items-center rounded-sm bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary uppercase tracking-wider">{s}</span>;
  }`
);

fs.writeFileSync('frontend/src/app/inventory/logs/page.tsx', code);
console.log('Log Kayu (List) updated');
