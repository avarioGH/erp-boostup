const fs = require('fs');

const paths = [
  'frontend/src/app/inventory/logs/[id]/page.tsx',
  'frontend/src/app/inventory/logs/create/page.tsx',
  'frontend/src/app/inventory/trimming/[id]/page.tsx',
  'frontend/src/app/inventory/input-logs/[id]/page.tsx',
  'frontend/src/app/inventory/input-logs/create/page.tsx'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf-8');
    code = code.replace(
      '<div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">',
      '<div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-8 px-4 md:px-6 box-border">'
    );
    fs.writeFileSync(p, code);
    console.log('Fixed wrapper in', p);
  }
});
