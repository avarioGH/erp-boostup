const fs = require('fs');
let file = 'frontend/src/app/sales/customers/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing imports
content = content.replace('import { api } from "@/lib/api";', 'import { api, FinanceAPI } from "@/lib/api";\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";\nimport { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";');

// 2. Add states and logic inside the component
const hookInjectionPoint = 'const formatCurrency = (value: number) => {';
const newLogic = `
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState('Transfer');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get('/customers/' + id);
      setData(res.data);
    } catch (error) {}
  };

  const handleSavePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return alert('Nominal harus lebih dari 0');
    setIsPaying(true);
    try {
      const sortedOrders = [...(salesOrders || [])].sort((a: any, b: any) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
      
      let remainingToAllocate = Number(payAmount);
      const unpaidOrders: any[] = [];
      
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
        customerId: id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payRef,
        allocations: unpaidOrders,
        allowUnallocated: true
      });

      alert('Pembayaran berhasil dicatat!');
      setPayModalOpen(false);
      setPayAmount('');
      setPayRef('');
      fetchDetail();
    } catch(err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPaying(false);
    }
  };

  const formatCurrency = (value: number) => {`;
content = content.replace(hookInjectionPoint, newLogic);

// 3. Inject onClick to the button
content = content.replace('<Button>', '<Button onClick={() => setPayModalOpen(true)}>');
// In case there is a class name:
content = content.replace(/<Button[^>]*>\s*<CreditCard className="w-4 h-4 mr-2" \/>\s*Bayar Piutang\s*<\/Button>/, '<Button onClick={() => { setPayAmount(financials?.totalOutstanding > 0 ? financials.totalOutstanding : \'\'); setPayModalOpen(true); }}><CreditCard className="w-4 h-4 mr-2" />Bayar Piutang</Button>');

// 4. Add the Dialog UI at the end of the return
const returnEndRegex = /<\/div>\s*<\/div>\s*<\/div>\s*\)\s*;/;
// Let's just use string replacement on the last closing div.
const dialogUI = `
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pembayaran Piutang</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nominal Pembayaran (Rp)</Label>
              <Input type="number" min="1" value={payAmount} onChange={e => setPayAmount(Number(e.target.value) || '')} placeholder="Nominal Rp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Bayar</Label>
                <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
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
            </div>
            <div className="space-y-2">
              <Label>Referensi (Opsional)</Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Misal: TF BCA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Batal</Button>
            <Button onClick={handleSavePayment} disabled={isPaying || !payAmount}>{isPaying ? 'Memproses...' : 'Simpan Pembayaran'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;
content = content.replace(/<\/div>\s*$/, dialogUI + '\n    </div>');

fs.writeFileSync('frontend/src/app/sales/customers/[id]/page.tsx', content);
