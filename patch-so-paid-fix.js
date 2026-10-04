const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

// Fix Quotation table back
c = c.replace(
  /<td className="px-4 py-3 text-right space-x-2">\s*\{so\.invoice_status[^<]+<Button[^>]+>[^<]+<\/Button>\s*\)\}\s*\{sisa > 0 && \(\s*<Button[^>]+>Bayar<\/Button>\s*\)\}\s*<\/td>/g,
  '<td className="px-4 py-3 text-right">{formatCurrency(q.total_amount)}</td>'
);

// Now target Sales Orders correctly
const soActionRegex = /<td className="px-4 py-3 text-right">\s*\{so\.invoice_status !== 'INVOICED' && \(\s*<Button[^>]+>\s*\{isCreatingInv === so\.id \? '\.\.\.' : 'Buat Faktur'\}\s*<\/Button>\s*\)\}\s*<\/td>/;

c = c.replace(soActionRegex, `<td className="px-4 py-3 text-right space-x-2">
     {so.invoice_status !== 'INVOICED' && (
        <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>
          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
        </Button>
     )}
     {sisa > 0 && (
        <Button variant="default" size="sm" onClick={() => { setPayAmount(sisa); setPayModalOpen(true); }}>Bayar</Button>
     )}
   </td>`);

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
