const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/logs/page.tsx', 'utf8');

if (!code.includes('dateFilter')) {
    code = code.replace('const [search, setSearch] = useState("")', 'const [search, setSearch] = useState("");\n const [dateFilter, setDateFilter] = useState("");');
}

const oldFilter = `const filtered = data.filter(item => \n item.logNumber?.toLowerCase().includes(search.toLowerCase()) || \n item.barcode?.toLowerCase().includes(search.toLowerCase()) ||\n item.batch?.toLowerCase().includes(search.toLowerCase())\n )`;
const newFilter = `const filtered = data.filter(item => {\n const matchSearch = item.logNumber?.toLowerCase().includes(search.toLowerCase()) || \n item.barcode?.toLowerCase().includes(search.toLowerCase()) ||\n item.batch?.toLowerCase().includes(search.toLowerCase());\n const itemDate = item.receivingDate || item.createdAt || item.created_at;\n const matchDate = dateFilter && itemDate ? new Date(itemDate).toISOString().split('T')[0] === dateFilter : true;\n return matchSearch && matchDate;\n})`;
code = code.replace(oldFilter, newFilter);

const oldToolbar = `<div className="relative w-full sm:w-64">\n <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />\n <Input type="search" placeholder="Search log no, barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />\n </div>`;
const newToolbar = `<div className="relative w-full sm:w-64">\n <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />\n <Input type="search" placeholder="Search log no, barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />\n </div>\n <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full sm:w-[150px]" />`;
code = code.replace(oldToolbar, newToolbar);

code = code.replace(/<th[^>]*>Log No<\/th>/, '<th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Date</th>\n<th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Log No</th>');

code = code.replace(/<th[^>]*>(A~|Ã˜|.*?) Avg<\/th>/g, '<th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">&Oslash; Avg</th>');
code = code.replace(/<th[^>]*>Net (MA3|MÂ³|M.*?)<\/th>/g, '<th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Net M&sup3;</th>');

code = code.replace(/colSpan=\{8\}/, 'colSpan={9}');

const oldRow = `<td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.logNumber}</td>`;
const newRow = `<td className="py-3.5 px-6 text-[13px] text-muted-foreground">{new Date(log.receivingDate || log.createdAt || Date.now()).toLocaleDateString('id-ID')}</td>\n <td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.logNumber}</td>`;
code = code.replace(oldRow, newRow);

fs.writeFileSync('src/app/inventory/logs/page.tsx', code);
