const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf-8');

// Fix JSX syntax error
code = code.replace(
  '</button>\n   </div>\n   </div>\n <div className="flex items-center gap-1 md:gap-4 shrink-0">',
  '</button>\n   </div>\n <div className="flex items-center gap-1 md:gap-4 shrink-0">'
);
fs.writeFileSync('frontend/src/components/app-header.tsx', code);
