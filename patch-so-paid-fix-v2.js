const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

const brokenQuotationAction = `<td className="px-4 py-3 text-right space-x-2">
     {so.invoice_status !== 'INVOICED' && (
        <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>
          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
        </Button>
     )}
     {sisa > 0 && (
        <Button variant="default" size="sm" onClick={() => { setPayAmount(sisa); setPayModalOpen(true); }}>Bayar</Button>
     )}
   </td>`;

// The first occurrence of this string is in Quotations. The second is in Sales Orders.
// We want to replace the first one with the proper Quotations action.
let parts = c.split(brokenQuotationAction);
if (parts.length > 1) {
  // Restore the first one (Quotations)
  c = parts[0] + '<td className="px-4 py-3 text-right">{formatCurrency(q.total_amount)}</td>' + parts.slice(1).join(brokenQuotationAction);
}

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
