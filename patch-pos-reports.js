const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/pos/reports/page.tsx', 'utf8');

// 1. Add imports
content = content.replace('import { Search, DollarSign, Receipt, TrendingUp } from "lucide-react"',
`import { Search, DollarSign, Receipt, TrendingUp, CheckCircle, CreditCard, Banknote } from "lucide-react"
import { FinanceAPI } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"`);

// 2. Add states for filtering and modal
const stateInjectionPoint = "const [search, setSearch] = useState(\"\")";
const newStates = `const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  
  // Payment Modal States
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [payAmount, setPayAmount] = useState<number | ''>('')
  const [payMethod, setPayMethod] = useState('Transfer')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payRef, setPayRef] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const handleOpenPay = (order: any) => {
    const paid = (order.allocations || []).reduce((sum: number, a: any) => sum + (a.amount || 0), 0)
    const outst = order.total_amount - paid
    
    setSelectedOrder(order)
    setPayAmount(outst > 0 ? outst : 0)
    setPayDate(new Date().toISOString().split('T')[0])
    setPayMethod('Transfer')
    setPayRef('')
    setPayModalOpen(true)
  }

  const handlePay = async () => {
    if (!payAmount || Number(payAmount) <= 0 || !selectedOrder) return alert('Nominal tidak valid')
    setIsPaying(true)
    try {
      await FinanceAPI.createPayment({
        customerId: selectedOrder.customer_id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        paymentDate: payDate,
        reference: payRef,
        allocations: [{ salesOrderId: selectedOrder.id, amount: Number(payAmount) }]
      })
      alert('Pembayaran piutang berhasil dicatat!')
      setPayModalOpen(false)
      fetchData() // Refresh list
    } catch(err: any) {
      alert('Gagal: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsPaying(false)
    }
  }`;
content = content.replace(stateInjectionPoint, newStates);

// 3. Update filtered array logic
const filteredRegex = /const filtered = history\.filter\(h =>[\s\S]*?toLowerCase\(\)\)\n\s*\)/m;
const newFiltered = `const filtered = history.filter(h => {
    const matchSearch = (h.order_number || "").toLowerCase().includes(search.toLowerCase()) ||
                        (h.customer?.name || "").toLowerCase().includes(search.toLowerCase())
    const isPaid = h.payment_status === "PAID"
    const matchStatus = statusFilter === "ALL" ? true : statusFilter === "PAID" ? isPaid : !isPaid
    return matchSearch && matchStatus
  })`;
content = content.replace(filteredRegex, newFiltered);

// 4. Update the Search bar area to include Filter Dropdown
const searchAreaRegex = /<div className="relative w-full sm:w-64">[\s\S]*?<\/div>/m;
const newSearchArea = `<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Cari nota atau pelanggan..." 
                className="pl-8" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="w-full sm:w-48">
              <UISelect value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Semua Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="PAID">Lunas</SelectItem>
                  <SelectItem value="PIUTANG">Piutang / Belum Lunas</SelectItem>
                </SelectContent>
              </UISelect>
            </div>
          </div>`;
content = content.replace(searchAreaRegex, newSearchArea);

// 5. Add "Aksi" column in Table Header
content = content.replace('<TableHead className="text-right">Total</TableHead>', '<TableHead className="text-right">Total</TableHead>\n                  <TableHead className="text-right w-24">Aksi</TableHead>');

// 6. Update Row rendering and Status badge
const rowStatusRegex = /<TableCell>\s*<span className=\{\`px-2 py-1 rounded-full text-xs font-medium \$\{item\.payment_status === "PAID" \? "bg-green-100 text-green-700" : item\.payment_status === "PARTIALLY_PAID" \? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"\}\`\}>\s*\{item\.payment_status === "PAID" \? "LUNAS" : item\.payment_status === "PARTIALLY_PAID" \? "PIUTANG" : "BELUM BAYAR"\}\s*<\/span>\s*<\/TableCell>\s*<TableCell className="text-right font-semibold">Rp \{\(item\.total_amount \|\| 0\)\.toLocaleString\("id-ID"\)\}<\/TableCell>/m;

const newRowStatus = `<TableCell>
                        <span className={\`px-2 py-1 rounded-full text-xs font-medium \${item.payment_status === "PAID" ? "bg-green-100 text-green-700" : item.payment_status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}\`}>
                          {item.payment_status === "PAID" ? "LUNAS" : item.payment_status === "PARTIALLY_PAID" ? "PIUTANG" : "BELUM BAYAR"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">Rp {(item.total_amount || 0).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        {item.payment_status !== "PAID" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleOpenPay(item)}>Bayar</Button>
                        )}
                      </TableCell>`;
content = content.replace(rowStatusRegex, newRowStatus);

// 7. Inject Modal at the end of the return statement
const modalHtml = `
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pencatatan Pembayaran Piutang</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 border rounded text-sm space-y-1">
              <p><span className="text-gray-500">Nota:</span> <span className="font-medium">{selectedOrder?.order_number}</span></p>
              <p><span className="text-gray-500">Pelanggan:</span> <span className="font-medium">{selectedOrder?.customer?.name || 'Umum'}</span></p>
              <p><span className="text-gray-500">Total Tagihan:</span> <span className="font-medium">Rp {(selectedOrder?.total_amount || 0).toLocaleString('id-ID')}</span></p>
            </div>
            
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
                <UISelect value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer Bank</SelectItem>
                    <SelectItem value="Cash">Cash / Tunai</SelectItem>
                    <SelectItem value="Debit">Debit Card</SelectItem>
                    <SelectItem value="Kredit">Kartu Kredit</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Referensi (Opsional)</Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Misal: TF BCA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Batal</Button>
            <Button onClick={handlePay} disabled={isPaying || !payAmount}>{isPaying ? 'Memproses...' : 'Simpan Pembayaran'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}`;
content = content.replace(/<\/div>\s*\)\s*\}/, modalHtml);

fs.writeFileSync('frontend/src/app/pos/reports/page.tsx', content);
