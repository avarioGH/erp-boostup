const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/input-logs/create/page.tsx', 'utf-8');

// Container
code = code.replace(
  /<div className="space-y-6 pb-10">/,
  '<div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-8">'
);

// Header padding
code = code.replace(
  /<div className="flex items-center gap-4">/,
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">'
);

// Title styling
code = code.replace(
  /<h1 className="text-\[28px\] font-bold tracking-tight text-foreground">Create Input Log<\/h1>/,
  '<h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Create Input Log</h1>'
);

// Cards
code = code.replace(/<Card className="shadow-sm border-border">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');
code = code.replace(/<Card className="shadow-sm">/g, '<Card className="bg-card rounded-xl border border-border shadow-sm">');
code = code.replace(/<CardHeader className="bg-muted\/10 border-b pb-4">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">');
code = code.replace(/<CardHeader className="bg-muted\/10 border-b pb-4 flex flex-row items-center justify-between">/g, '<CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">');

code = code.replace(/<CardTitle className="text-\[16px\] font-semibold">/g, '<CardTitle className="text-base font-bold">');

// Back Button wrapper
code = code.replace(
  /<Button variant="ghost" onClick=\{\(\) => router.back\(\)\} className="px-2">/,
  '<div className="flex items-center gap-2">\n          <Button variant="ghost" onClick={() => router.back()} className="px-2">'
);
code = code.replace(
  /<\/p>\n        <\/div>/,
  '</p>\n        </div>\n        </div>'
); // close the flex items-center wrapper

// Table styling
code = code.replace(/<thead className="bg-muted border-b">/g, '<thead className="bg-muted/30 border-b border-border">');
code = code.replace(/text-\[\#526174\]/g, 'text-muted-foreground font-semibold');

// Form Actions at bottom
code = code.replace(
  /<div className="flex justify-end gap-4">/,
  '<div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 mt-8">'
);
code = code.replace(
  /<Button variant="outline" className="w-32"/,
  '<Button variant="outline" className="w-full sm:w-32"'
);
code = code.replace(
  /<Button onClick=\{handleSubmit\} disabled=\{submitting\} className="w-48">/,
  '<Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-48 shadow-sm font-semibold">'
);

fs.writeFileSync('frontend/src/app/inventory/input-logs/create/page.tsx', code);
console.log('Input Log Create updated');
