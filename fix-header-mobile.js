const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf-8');

// Compact Warehouse Selector on mobile
code = code.replace(
  /<DropdownMenuTrigger className="(.*?px-3.*?)">/,
  '<DropdownMenuTrigger className="flex items-center gap-2 md:gap-2.5 px-2 md:px-3 py-1.5 border border-sidebar-border bg-sidebar-accent/30 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all ml-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring text-sidebar-foreground">'
);
code = code.replace(
  /<div className="flex flex-col items-start">/,
  '<div className="hidden md:flex flex-col items-start">'
);
code = code.replace(
  /<ChevronDown className="w-4 h-4 text-sidebar-foreground\/70 ml-1" \/>/,
  '<ChevronDown className="w-4 h-4 text-sidebar-foreground/70 ml-1 hidden md:block" />'
);

// Mobile Search Icon
code = code.replace(
  /<div className="flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent\/50 px-3 text-sidebar-foreground focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-sidebar-primary transition-all shadow-sm">/,
  '<div className="hidden md:flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 text-sidebar-foreground focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-sidebar-primary transition-all shadow-sm">'
);

const searchBlock = `<div className="flex flex-1 items-center gap-4 px-2 lg:px-6">
 <div className="hidden md:flex h-9 w-full max-w-lg items-center gap-2.5 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 text-sidebar-foreground focus-within:border-sidebar-primary focus-within:ring-1 focus-within:ring-sidebar-primary transition-all shadow-sm">
 <Search className="h-[15px] w-[15px] opacity-70" />
 <input 
 type="text" 
 placeholder="Cari menu, pelanggan, atau transaksi... (Ctrl+K)" 
 className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-sidebar-foreground/50 text-sidebar-foreground"
 />
 <div className="hidden sm:flex items-center gap-1 opacity-60">
 <Command className="h-3 w-3" />
 <span className="text-[10px] font-medium tracking-widest">K</span>
 </div>
 </div>
 <button className="md:hidden relative text-sidebar-foreground/80 hover:text-sidebar-accent-foreground transition-colors h-9 w-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent ml-auto">
   <Search className="h-4 w-4" />
 </button>
 </div>`;

code = code.replace(/<div className="flex flex-1 items-center gap-4 px-2 lg:px-6">[\s\S]*?<\/div>\s*<\/div>/, searchBlock);

// Theme Toggle and Bell container
code = code.replace(
  /<div className="flex items-center gap-3 md:gap-4 shrink-0">/,
  '<div className="flex items-center gap-1 md:gap-4 shrink-0">'
);

fs.writeFileSync('frontend/src/components/app-header.tsx', code);
console.log('AppHeader mobile responsive fixed.');
