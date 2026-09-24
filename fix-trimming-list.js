const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/trimming/page.tsx', 'utf-8');

// Container
code = code.replace(
  /<div className="space-y-6 pb-10">/,
  '<div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Header padding
code = code.replace(
  /<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">/,
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">'
);

// Title styling
code = code.replace(
  /<h1 className="text-\[28px\] font-bold tracking-tight text-foreground">Trimmed Logs<\/h1>/,
  '<h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary w-6 h-6"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M3 3h18v18H3z"/></svg> Log Trimming</h1>'
);
code = code.replace(
  /<p className="text-muted-foreground mt-1">Registry of individual logs after trimming process\.<\/p>/,
  '<p className="text-sm text-muted-foreground max-w-2xl">Pemotongan dan penyesuaian log sebelum menjadi input produksi.</p>'
);

// Card
code = code.replace(/<Card className="shadow-sm">/, '<Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">');
code = code.replace(/<CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border\/40">/, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">');

code = code.replace(/<CardTitle className="text-\[16px\] font-semibold">Trimming Inventory<\/CardTitle>/, '<CardTitle className="text-base font-bold">Data Trimming</CardTitle>');

code = code.replace(/<div className="relative w-full sm:w-64">/g, '<div className="relative w-full sm:w-64">\n<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />');
code = code.replace(/<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" \/>\n<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" \/>/g, '<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-70" />');
code = code.replace(/className="pl-8"/g, 'className="pl-9 bg-background"');

// Table scrolling constraint for Mobile
code = code.replace(
  /<div className="overflow-x-auto">/,
  '<div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">'
);

// Table styling
code = code.replace(/<thead className="bg-muted border-y border-border">/g, '<thead className="bg-muted/30 border-b border-border">');
code = code.replace(/text-\[\#526174\] font-semibold text-\[13px\] tracking-wide/g, 'font-semibold text-muted-foreground h-11');
code = code.replace(/<td className="py-3\.5 px-6/g, '<td className="py-3 px-6');
code = code.replace(/<td className="p-4 px-6 text-primary">/g, '<td className="py-3 px-6 text-primary font-medium">');
code = code.replace(/text-primary text-\[13px\]/g, 'text-foreground/90');
code = code.replace(/M\?/g, 'M³');

// Status badge
code = code.replace(/<Badge variant=\{log\.status ==="AVAILABLE" \?"default" :"secondary"\} className=\{log\.status ==="AVAILABLE" \?"bg-emerald-500" :""\}>\{log\.status\}<\/Badge>/g, '{log.status === "AVAILABLE" || log.status === "CONFIRMED" ? <span className="inline-flex items-center rounded-sm bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success-foreground uppercase tracking-wider">{log.status}</span> : <span className="inline-flex items-center rounded-sm bg-secondary/80 text-secondary-foreground px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">{log.status}</span>}');

fs.writeFileSync('frontend/src/app/inventory/trimming/page.tsx', code);
console.log('Trimming List updated');
