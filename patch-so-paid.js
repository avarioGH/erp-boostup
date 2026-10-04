const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

// 1. Fix the `paid` calculation
c = c.replace(
  /const paid = so\.paid_amount !== undefined \? so\.paid_amount : \(so\.total_amount \|\| 0\);/g,
  "const paid = so.allocations?.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || 0;"
);

// 2. Fix the Bayar button. Let's find the specific block for the Action column.
const actionRegex = /<td className="px-4 py-3 text-right">[\s\S]*?<\/td>/;

c = c.replace(actionRegex, (match) => {
  return `<td className="px-4 py-3 text-right space-x-2">
     {so.invoice_status !== 'INVOICED' && (
        <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>
          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
        </Button>
     )}
     {sisa > 0 && (
        <Button variant="default" size="sm" onClick={() => { setPayAmount(sisa); setPayModalOpen(true); }}>Bayar</Button>
     )}
   </td>`;
});

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
