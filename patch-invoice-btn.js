const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `  <td className="px-4 py-3 text-right">
     {so.invoice_status !== 'INVOICED' ? (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCreateInvoice(so.id); }} disabled={isCreatingInv === so.id}>
          {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
        </Button>
     ) : (
        <div className="flex flex-col items-end gap-1">
          {linkedInvs.length > 0 ? linkedInvs.map((inv: any) => (
             <Badge key={inv.id} variant="secondary" className="cursor-pointer hover:bg-muted" onClick={(e) => { e.stopPropagation(); const tab = document.querySelector('[value="finance"]'); if(tab) (tab as HTMLElement).click(); }}>
               {inv.invoice_number}
             </Badge>
          )) : (
             <span className="text-muted-foreground text-xs">Sudah Difaktur</span>
          )}
        </div>
     )}
   </td>`;

code = code.replace(
  /<td className="px-4 py-3 text-right">\s*\{so\.invoice_status !== 'INVOICED' && \(\s*<Button variant="outline" size="sm" onClick=\{\(\) => handleCreateInvoice\(so\.id\)\} disabled=\{isCreatingInv === so\.id\}>\s*\{isCreatingInv === so\.id \? '\.\.\.' : 'Buat Faktur'\}\s*<\/Button>\s*\)\}\s*<\/td>/,
  replacement
);

fs.writeFileSync(path, code);
console.log('patched invoice button');
