const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(
  "<td className=\"px-4 py-3 text-right\">\n     {so.invoice_status !== 'INVOICED' && (\n        <Button variant=\"outline\" size=\"sm\" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>\n          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}\n        </Button>\n     )}\n   </td>",
  `<td className="px-4 py-3 text-right">
     {so.invoice_status !== 'INVOICED' && (
        <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>
          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
        </Button>
     )}
     {sisa > 0 && (
        <Button variant="outline" size="sm" className="ml-2 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setPayAmount(sisa); setPayModalOpen(true); }}>
          Bayar
        </Button>
     )}
   </td>`
);
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
