const fs = require('fs');
let file = 'frontend/src/app/pos/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of onValueChange passing setX functions directly
content = content.replace(/onValueChange=\{setPayMethod\}/g, 'onValueChange={(v) => setPayMethod(v || "")}');
content = content.replace(/onValueChange=\{setPayAccount\}/g, 'onValueChange={(v) => setPayAccount(v || "")}');
content = content.replace(/onValueChange=\{setStatusFilter\}/g, 'onValueChange={(v) => setStatusFilter(v || "ALL")}'); // just in case there are other occurrences

fs.writeFileSync(file, content);
