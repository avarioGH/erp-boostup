const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

// 1. Destructuring fix
c = c.replace(
  "const { profile, sales, finance, crm, timeline } = data;",
  "const { customer: profile, summary, salesOrders, invoices, payments, nettings, opportunities, activities, timeline } = data;\n  const finance = { outstandingAmount: summary?.outstanding || 0, outstandingAp: summary?.outstanding_ap || 0, netBalance: summary?.net_balance || 0, invoices: invoices || [], payments: payments || [], nettings: nettings || [] };\n  const sales = { orderCount: salesOrders?.length || 0, totalInvoiced: summary?.total_invoiced || 0, totalPurchased: summary?.total_purchased || 0 };\n  const crm = { activeOpportunities: opportunities?.length || 0 };"
);

// 2. Add Hutang card
c = c.replace(
  `<CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang</CardTitle>`,
  `<CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang</CardTitle>`
); // Keep Piutang

// Wait, I will just do a regex replace to insert Hutang next to Piutang
const piutangCardRegex = /<Card className="shadow-sm">[\s\S]*?Total Piutang[\s\S]*?<\/Card>/;
c = c.replace(piutangCardRegex, (match) => {
  return match + `
  <Card className="shadow-sm">
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">Total Hutang</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-orange-600">{formatCurrency(finance.outstandingAp || 0)}</div>
    </CardContent>
  </Card>
  <Card className="shadow-sm bg-primary/5">
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-sm font-medium text-primary">Net Balance</CardTitle>
      {(finance.outstandingAmount > 0 && finance.outstandingAp > 0) && (
        <Button size="sm" onClick={() => setNettingModalOpen(true)}>Kompensasi</Button>
      )}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-primary">{formatCurrency(finance.netBalance || 0)}</div>
      <p className="text-xs text-muted-foreground mt-1">{(finance.netBalance > 0) ? 'Perusahaan berpiutang' : (finance.netBalance < 0 ? 'Perusahaan berhutang' : 'Lunas')}</p>
    </CardContent>
  </Card>
  `;
});

// 3. Add Netting Modal state
c = c.replace(
  "const [isCreatingInv, setIsCreatingInv] = useState<string | null>(null);",
  "const [isCreatingInv, setIsCreatingInv] = useState<string | null>(null);\n  const [nettingModalOpen, setNettingModalOpen] = useState(false);\n  const [nettingAmount, setNettingAmount] = useState('');\n  const [nettingNotes, setNettingNotes] = useState('');"
);

// 4. Add Netting Submit handler
c = c.replace(
  "const handlePay = async () => {",
  `const handleNetting = async () => {
    try {
      if(!nettingAmount || Number(nettingAmount) <= 0) return alert('Nominal invalid');
      await api.post('/finance/netting', { partner_id: partnerId, amount: Number(nettingAmount), notes: nettingNotes });
      setNettingModalOpen(false);
      setNettingAmount('');
      const res = await CRMAPI.getPartner360(partnerId);
      setData(res);
      alert('Kompensasi berhasil!');
    } catch(err:any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    }
  };
  const handlePay = async () => {`
);

// 5. Add Netting Modal UI
const nettingModalUI = `
<Dialog open={nettingModalOpen} onOpenChange={setNettingModalOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Kompensasi / Netting</DialogTitle></DialogHeader>
    <div className="space-y-4 py-4">
      <div className="flex justify-between text-sm">
        <span>Maksimal Kompensasi:</span>
        <span className="font-bold">{formatCurrency(Math.min(finance.outstandingAmount, finance.outstandingAp))}</span>
      </div>
      <div className="space-y-2">
        <label className="text-sm">Nominal Kompensasi</label>
        <Input type="number" value={nettingAmount} onChange={e => setNettingAmount(e.target.value)} placeholder="0" />
      </div>
      <div className="space-y-2">
        <label className="text-sm">Catatan</label>
        <Input value={nettingNotes} onChange={e => setNettingNotes(e.target.value)} placeholder="Catatan kompensasi..." />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setNettingModalOpen(false)}>Batal</Button>
      <Button onClick={handleNetting}>Proses Kompensasi</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
`;
c = c.replace("{/* MODALS */}", "{/* MODALS */}\n" + nettingModalUI);

// 6. In Keuangan Tab, split Invoices into AR and AP
// We need to replace the single invoice table with two tables, or just add a 'Type' column. Let's add a Type column.
c = c.replace(
  /<th className="px-4 py-3 font-medium">Nomor Faktur<\/th>/g,
  '<th className="px-4 py-3 font-medium">Nomor Faktur</th>\n<th className="px-4 py-3 font-medium">Tipe</th>'
);
c = c.replace(
  /<td className="px-4 py-3 font-mono text-xs">\{inv.invoice_number\}<\/td>/g,
  '<td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>\n<td className="px-4 py-3 text-xs">{inv.type === "AR" ? "Penjualan (AR)" : "Pembelian (AP)"}</td>'
);

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
