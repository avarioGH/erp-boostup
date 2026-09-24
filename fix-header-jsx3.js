const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/app-header.tsx', 'utf-8');

// The error block looks like:
// </button>
// </div>
// </div>
// <div className="flex items-center gap-1 md:gap-4 shrink-0">

code = code.replace(
  '</button>\r\n </div>\r\n </div>\r\n <div className="flex items-center gap-1 md:gap-4 shrink-0">',
  '</button>\r\n </div>\r\n <div className="flex items-center gap-1 md:gap-4 shrink-0">'
);
code = code.replace(
  '</button>\n </div>\n </div>\n <div className="flex items-center gap-1 md:gap-4 shrink-0">',
  '</button>\n </div>\n <div className="flex items-center gap-1 md:gap-4 shrink-0">'
);
code = code.replace(
  /<\/button>\s*<\/div>\s*<\/div>\s*<div className="flex items-center gap-1 md:gap-4 shrink-0">/g,
  '</button>\n </div>\n <div className="flex items-center gap-1 md:gap-4 shrink-0">'
);

fs.writeFileSync('frontend/src/components/app-header.tsx', code);
