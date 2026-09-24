const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf-8');

// Replace header container styling
code = code.replace(
    /className="flex h-16 shrink-0 items-center gap-4 border-b border-border\/60 bg-background\/90 backdrop-blur supports-\[backdrop-filter\]:bg-background\/70 px-6 z-10 transition-colors"/,
    'className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border bg-sidebar px-6 z-10 transition-colors text-sidebar-foreground shadow-sm"'
);

// SidebarTrigger text
code = code.replace(
    /<SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" \/>/,
    '<SidebarTrigger className="-ml-1 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" />'
);

// Separator
code = code.replace(
    /<Separator orientation="vertical" className="mx-1 h-5 bg-border" \/>/,
    '<Separator orientation="vertical" className="mx-1 h-5 bg-sidebar-border" />'
);

// Warehouse Selector Trigger styling
code = code.replace(
    /className="flex items-center gap-2.5 px-3 py-1.5 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"/,
    'className="flex items-center gap-2.5 px-3 py-1.5 border border-sidebar-border bg-sidebar-accent/30 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all ml-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring text-sidebar-foreground"'
);
code = code.replace(
    /<span className="text-\[9px\] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">/,
    '<span className="text-[9px] font-bold text-sidebar-foreground/70 uppercase tracking-widest leading-none mb-1">'
);
code = code.replace(
    /<span className="text-\[13px\] font-semibold text-foreground leading-none truncate max-w-\[140px\]">/,
    '<span className="text-[13px] font-semibold text-sidebar-foreground leading-none truncate max-w-[140px]">'
);
code = code.replace(
    /<ChevronDown className="w-4 h-4 text-muted-foreground ml-1" \/>/,
    '<ChevronDown className="w-4 h-4 text-sidebar-foreground/70 ml-1" />'
);

// Search Bar
code = code.replace(
    /<div className="flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all shadow-sm">/,
    '<div className="flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 text-sidebar-foreground focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-sidebar-primary transition-all shadow-sm">'
);
code = code.replace(
    /className="flex-1 bg-transparent text-\[13px\] outline-none placeholder:text-muted-foreground\/70"/,
    'className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-sidebar-foreground/50 text-sidebar-foreground"'
);

// Right icons
code = code.replace(
    /<button className="relative text-muted-foreground hover:text-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent">/,
    '<button className="relative text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent">'
);
code = code.replace(
    /<Separator orientation="vertical" className="hidden md:block h-5 bg-border mx-1" \/>/,
    '<Separator orientation="vertical" className="hidden md:block h-5 bg-sidebar-border mx-1" />'
);
code = code.replace(
    /<div className="flex items-center gap-3 cursor-pointer group hover:bg-accent py-1 px-2 rounded-md transition-colors">/,
    '<div className="flex items-center gap-3 cursor-pointer group hover:bg-sidebar-accent py-1 px-2 rounded-md transition-colors">'
);
code = code.replace(
    /<span className="text-\[13px\] font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">/,
    '<span className="text-[13px] font-semibold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors leading-tight">'
);
code = code.replace(
    /<span className="text-\[11px\] text-muted-foreground font-medium leading-tight">/,
    '<span className="text-[11px] text-sidebar-foreground/70 font-medium leading-tight">'
);

fs.writeFileSync('frontend/src/components/app-header.tsx', code);
console.log('AppHeader updated for dark navy theme.');
