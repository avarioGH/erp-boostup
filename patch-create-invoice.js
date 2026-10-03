const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/crm/customers/[id]/page.tsx', 'utf8');

// 1. Add state for isCreatingInv
const stateInjectionPoint = "const [isSavingAct, setIsSavingAct] = useState(false);";
const newStates = `const [isSavingAct, setIsSavingAct] = useState(false);
  const [isCreatingInv, setIsCreatingInv] = useState<string | null>(null);

  const handleCreateInvoice = async (soId: string) => {
    setIsCreatingInv(soId);
    try {
      await FinanceAPI.createInvoiceFromSO({ salesOrderId: soId });
      alert('Faktur berhasil dibuat!');
      const res = await CRMAPI.getCustomer360(customerId);
      setData(res); // Refresh all data to update the invoices table
    } catch(err: any) {
      alert('Gagal membuat faktur: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingInv(null);
    }
  };`;
content = content.replace(stateInjectionPoint, newStates);

// 2. Add 'Aksi' to the Sales Orders table header
const soHeaderRegex = /<th className="px-4 py-3 font-medium text-right">Total<\/th>\s*<th className="px-4 py-3 font-medium text-right">Sisa Piutang<\/th>/;
const newSoHeader = `<th className="px-4 py-3 font-medium text-right">Total</th>
 <th className="px-4 py-3 font-medium text-right">Sisa Piutang</th>
 <th className="px-4 py-3 font-medium text-right">Aksi</th>`;
content = content.replace(soHeaderRegex, newSoHeader);

// 3. Add 'Buat Faktur' button in the Sales Orders table row
const soRowRegex = /<td className=\{\`px-4 py-3 text-right font-semibold \$\{sisa > 0 \? 'text-amber-600' : 'text-muted-foreground'\}\`\}>\{sisa > 0 \? formatCurrency\(sisa\) : '-'\}(\s*<\/td>)/;
const newSoRow = `<td className={\`px-4 py-3 text-right font-semibold \${sisa > 0 ? 'text-amber-600' : 'text-muted-foreground'}\`}>{sisa > 0 ? formatCurrency(sisa) : '-'}</td>
 <td className="px-4 py-3 text-right">
   {so.invoice_status !== 'INVOICED' && (
      <Button variant="outline" size="sm" onClick={() => handleCreateInvoice(so.id)} disabled={isCreatingInv === so.id}>
        {isCreatingInv === so.id ? '...' : 'Buat Faktur'}
      </Button>
   )}
 </td>`;
content = content.replace(soRowRegex, newSoRow);

// 4. Update the colSpan when empty
content = content.replace('colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada transaksi.', 'colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada transaksi.');

fs.writeFileSync('frontend/src/app/crm/customers/[id]/page.tsx', content);
