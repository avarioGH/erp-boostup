
const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Remove the local Cabang dropdown
const dropdownStart = content.indexOf('<div className="flex items-center gap-3 bg-card p-1.5 rounded-lg border border-border shadow-sm">');
const dropdownEnd = content.indexOf('</div>', dropdownStart) + 6; // end of first div
const nextDivEnd = content.indexOf('</div>', dropdownEnd) + 6; // end of outer div? No, I'll just regex replace it out.

