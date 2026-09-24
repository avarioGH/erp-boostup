const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/app-sidebar.tsx', 'utf-8');

// Replace general theme colors with sidebar specific ones
code = code.replace(/text-muted-foreground/g, 'text-sidebar-foreground/70');
code = code.replace(/hover:text-foreground/g, 'hover:text-sidebar-foreground');
code = code.replace(/hover:bg-accent/g, 'hover:bg-sidebar-accent');
code = code.replace(/bg-accent\/50/g, 'bg-sidebar-accent/50');
code = code.replace(/text-foreground/g, 'text-sidebar-foreground');
code = code.replace(/border-border/g, 'border-sidebar-border');
code = code.replace(/text-\[\#8A94A6\]/g, 'text-sidebar-foreground/50');

// Active state
code = code.replace(/bg-primary\/10 text-primary dark:bg-primary\/15/g, 'bg-sidebar-primary text-sidebar-primary-foreground');
code = code.replace(/text-primary/g, 'text-sidebar-primary');
code = code.replace(/bg-primary\/10/g, 'bg-sidebar-primary/20');
code = code.replace(/bg-sidebar-primary\/20 text-sidebar-primary/g, 'bg-sidebar-primary text-sidebar-primary-foreground');

// The active text-primary for subItems
code = code.replace(/text-sidebar-primary font-semibold/g, 'text-sidebar-primary-foreground font-bold');

fs.writeFileSync('frontend/src/components/app-sidebar.tsx', code);
console.log('AppSidebar styling updated to use sidebar context.');
