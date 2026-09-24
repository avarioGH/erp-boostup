const fs = require('fs');

function fixLogs() {
  let code = fs.readFileSync('frontend/src/app/inventory/logs/page.tsx', 'utf-8');
  
  // Fix page layout for mobile overflow (ensure body/main is not forcing overflow)
  // Check if max-w-[1400px] is causing issues without w-full.
  code = code.replace(
    '<div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">',
    '<div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-8 px-4 md:px-6 box-border">'
  );

  // Remove the old inline empty state and replace the main loading ternary
  code = code.replace(
    '{loading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (',
    `{loading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : filtered.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center">
 <Package className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
 <h3 className="text-base font-semibold text-foreground mb-1">No raw logs yet</h3>
 <p className="text-[13.5px] text-muted-foreground max-w-sm mb-6">There are no raw timber logs matching the current warehouse or filter.</p>
 <Button onClick={(e) => { e.stopPropagation(); router.push('/inventory/logs/create'); }} className="w-full sm:w-auto h-10 px-6 shadow-sm">
 <Plus className="w-4 h-4 mr-2" /> Register Raw Log
 </Button>
 </div>
 ) : (`
  );

  code = code.replace(
    /\{filtered\.length === 0 \? <tr>[\s\S]*?<\/tr> :\s*(filtered\.map\([\s\S]*?\))\s*\}/,
    '{$1}'
  );

  fs.writeFileSync('frontend/src/app/inventory/logs/page.tsx', code);
  console.log('Logs fixed');
}

fixLogs();
