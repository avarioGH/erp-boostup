const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/crm/customers/[id]/page.tsx', 'utf8');

// 1. Add imports
content = content.replace("import { CRMAPI } from '@/lib/api';", "import { CRMAPI, FinanceAPI } from '@/lib/api';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';\nimport { Label } from '@/components/ui/label';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';");

// 2. Add state inside the component
const stateInjectionPoint = "const [error, setError] = useState<string | null>(null);";
const newStates = `const [error, setError] = useState<string | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('Transfer');
  const [payRef, setPayRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0) return alert('Nominal tidak valid');
    setIsPaying(true);
    try {
      const unpaidOrders: any[] = [];
      let remainingToAllocate = Number(payAmount);
      
      const sortedOrders = [...(data?.sales?.orders || [])].sort((a,b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
      
      for (const so of sortedOrders) {
        if (remainingToAllocate <= 0) break;
        if (so.status === 'CANCELLED') continue;
        
        const paid = so.allocations?.reduce((acc: number, a: any) => acc + a.amount, 0) || 0;
        const outst = so.total_amount - paid;
        
        if (outst > 0) {
          const allocate = Math.min(outst, remainingToAllocate);
          unpaidOrders.push({ salesOrderId: so.id, amount: allocate });
          remainingToAllocate -= allocate;
        }
      }

      await FinanceAPI.createPayment({
        customerId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        reference: payRef,
        allocations: unpaidOrders,
        allowUnallocated: true
      });

      alert('Pembayaran berhasil!');
      setPayModalOpen(false);
      setPayAmount('');
      setPayRef('');
      
      const res = await CRMAPI.getCustomer360(customerId);
      setData(res);
    } catch(err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPaying(false);
    }
  };`;
content = content.replace(stateInjectionPoint, newStates);

// 3. Inject Modal at the end of the return
const modalHtml = `
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Terima Pembayaran Piutang</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input type="number" min="1" value={payAmount} onChange={e => setPayAmount(Number(e.target.value) || '')} placeholder="Sisa: Rp " />
              <p className="text-xs text-muted-foreground">Sisa tagihan otomatis akan teralokasi mulai dari nota terlama.</p>
            </div>
            <div className="space-y-2">
              <Label>Metode</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">Transfer Bank</SelectItem>
                  <SelectItem value="Cash">Cash / Tunai</SelectItem>
                  <SelectItem value="Debit">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referensi (Opsional)</Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Contoh: INV-001, BCA ke BCA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Batal</Button>
            <Button onClick={handlePay} disabled={isPaying || !payAmount}>{isPaying ? 'Memproses...' : 'Simpan Pembayaran'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;
content = content.replace(/<\/div>\s*<\/div>\s*\);\s*}/, "</div>" + modalHtml);

// 4. Update Total Piutang Card
const oldCardRegex = /<Card className="shadow-sm">\s*<CardHeader className="pb-2">\s*<CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang<\/CardTitle>\s*<\/CardHeader>\s*<CardContent>\s*<div className="text-2xl font-bold text-destructive">\{formatCurrency\(finance\.outstandingAmount \|\| 0\)\}<\/div>\s*<\/CardContent>\s*<\/Card>/;
const newCard = `<Card className="shadow-sm">
 <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
 <CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang</CardTitle>
 {finance.outstandingAmount > 0 && <Button variant="outline" size="sm" className="h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setPayAmount(finance.outstandingAmount || 0); setPayModalOpen(true); }}>Bayar</Button>}
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-destructive">{formatCurrency(finance.outstandingAmount || 0)}</div>
 </CardContent>
 </Card>`;
content = content.replace(oldCardRegex, newCard);

fs.writeFileSync('frontend/src/app/crm/customers/[id]/page.tsx', content);
