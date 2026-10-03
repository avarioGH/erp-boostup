const fs = require('fs');
let r = fs.readFileSync('frontend/src/app/crm/customers/[id]/page.tsx', 'utf8');

const noSalesIdx = r.indexOf('No sales');
const bodyStart = r.lastIndexOf('<tbody>', noSalesIdx);
const bodyEnd = r.indexOf('</tbody>', noSalesIdx) + '</tbody>'.length;
const theadEnd = r.lastIndexOf('</thead>', bodyStart);
const thOrderIdx = r.lastIndexOf('<tr>', theadEnd);
const headEnd = theadEnd + '</thead>'.length;

const oldHead = r.substring(thOrderIdx, headEnd);
const oldBody = r.substring(bodyStart, bodyEnd);

const newHead = `<tr>\r\n <th className="px-4 py-3 font-medium">Order #</th>\r\n <th className="px-4 py-3 font-medium">Tanggal</th>\r\n <th className="px-4 py-3 font-medium">Status Order</th>\r\n <th className="px-4 py-3 font-medium">Status Bayar</th>\r\n <th className="px-4 py-3 font-medium text-right">Total</th>\r\n <th className="px-4 py-3 font-medium text-right">Sisa Piutang</th>\r\n </tr>\r\n </thead>`;

const newBody = `<tbody>\r\n {sales.orders.map((so: any) => {\r\n   const paid = so.paid_amount !== undefined ? so.paid_amount : (so.total_amount || 0);\r\n   const sisa = Math.max(0, (so.total_amount || 0) - paid);\r\n   return (\r\n <tr key={so.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">\r\n <td className="px-4 py-3 font-mono text-xs">{so.order_number}</td>\r\n <td className="px-4 py-3">{new Date(so.order_date || so.created_at).toLocaleDateString()}</td>\r\n <td className="px-4 py-3"><Badge variant="outline">{so.status}</Badge></td>\r\n <td className="px-4 py-3">\r\n   <span className={\`px-2 py-1 rounded-full text-xs font-bold \${so.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : so.payment_status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}\`}>\r\n     {so.payment_status === 'PAID' ? 'LUNAS' : so.payment_status === 'PARTIALLY_PAID' ? 'PIUTANG' : 'BELUM BAYAR'}\r\n   </span>\r\n </td>\r\n <td className="px-4 py-3 text-right">{formatCurrency(so.total_amount)}</td>\r\n <td className={\`px-4 py-3 text-right font-semibold \${sisa > 0 ? 'text-amber-600' : 'text-muted-foreground'}\`}>{sisa > 0 ? formatCurrency(sisa) : '-'}</td>\r\n </tr>\r\n   );\r\n })}\r\n {sales.orders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada transaksi.</td></tr>}\r\n </tbody>`;

r = r.substring(0, thOrderIdx) + newHead + r.substring(headEnd, bodyStart) + newBody + r.substring(bodyEnd);
fs.writeFileSync('frontend/src/app/crm/customers/[id]/page.tsx', r);

// Verify
if (r.includes('Status Bayar') && r.includes('Sisa Piutang') && r.includes('PIUTANG')) {
  console.log('SUCCESS');
} else {
  console.log('PARTIAL - missing some content');
}
