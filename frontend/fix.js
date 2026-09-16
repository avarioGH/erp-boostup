const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/logs/page.tsx', 'utf8');

// 1. Fix filtered
const oldFilter = const filtered = data.filter(item => 
 item.logNumber?.toLowerCase().includes(search.toLowerCase()) || 
 item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
 item.batch?.toLowerCase().includes(search.toLowerCase())
 );
const newFilter = const filtered = data.filter(item => {
 const matchSearch = item.logNumber?.toLowerCase().includes(search.toLowerCase()) || 
                     item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
                     item.batch?.toLowerCase().includes(search.toLowerCase());
 const itemDate = item.receivingDate || item.createdAt || item.created_at;
 const matchDate = dateFilter && itemDate ? new Date(itemDate).toISOString().split('T')[0] === dateFilter : true;
 return matchSearch && matchDate;
});
code = code.replace(oldFilter, newFilter);

// 2. Fix A~ Avg and Net MA3 or Ã˜ Avg
code = code.replace(/<th[^>]*>(A~|Ã˜|) Avg<\/th>/g, '<th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">&Oslash; Avg</th>');
code = code.replace(/<th[^>]*>Net (MA3|MÂ³|M)<\/th>/g, '<th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Net M&sup3;</th>');

// 3. Insert row date
const oldRow = <td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.logNumber}</td>;
const newRow = <td className="py-3.5 px-6 text-muted-foreground text-[13px]">{new Date(log.receivingDate || log.createdAt || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.logNumber}</td>;
code = code.replace(oldRow, newRow);

fs.writeFileSync('src/app/inventory/logs/page.tsx', code);
