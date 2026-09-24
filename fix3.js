const fs = require('fs');

function fixInputLogs() {
  let code = fs.readFileSync('frontend/src/app/inventory/input-logs/page.tsx', 'utf-8');
  
  code = code.replace(
    '<div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">',
    '<div className="space-y-4 md:space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-8 px-4 md:px-6 box-border">'
  );

  code = code.replace(
    '{loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (',
    `{loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : filtered.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center">
 <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-muted-foreground mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
 <h3 className="text-base font-semibold text-foreground mb-1">No records found</h3>
 <p className="text-[13.5px] text-muted-foreground max-w-sm mb-6">Belum ada Input Log.</p>
 </div>
 ) : (`
  );

  code = code.replace(
    /\{filtered\.length === 0 \? <tr>[\s\S]*?<\/tr> :\s*(filtered\.map\([\s\S]*?\))\s*\}/,
    '{$1}'
  );

  fs.writeFileSync('frontend/src/app/inventory/input-logs/page.tsx', code);
  console.log('Input Logs fixed');
}

fixInputLogs();
