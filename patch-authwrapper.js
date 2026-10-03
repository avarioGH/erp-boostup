const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/auth-wrapper.tsx', 'utf8');

// Replace AppSidebar with print:hidden wrapped
content = content.replace('<AppSidebar />', '<div className="print:hidden"><AppSidebar /></div>');

// Replace AppHeader with print:hidden wrapped
content = content.replace('<AppHeader />', '<div className="print:hidden"><AppHeader /></div>');

// Remove p-6 md:p-8 on print, allow overflow
content = content.replace('className="flex-1 overflow-auto bg-background p-6 md:p-8"', 'className="flex-1 overflow-auto bg-background p-6 md:p-8 print:p-0 print:overflow-visible print:bg-white"');

// Remove max-w-7xl on print
content = content.replace('className="mx-auto max-w-7xl"', 'className="mx-auto max-w-7xl print:max-w-none print:mx-0 print:w-full"');

fs.writeFileSync('frontend/src/components/auth-wrapper.tsx', content);
