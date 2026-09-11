"use client"
import { useState, useEffect } from 'react'
import { PurchasingAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Filter, ChevronLeft, CheckCircle2, FileText, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function RFQPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchRFQs() }, [])

  const fetchRFQs = async () => {
    try {
      setLoading(true)
      const res = await PurchasingAPI.getRFQs()
      const rfqs = (res?.data || []).filter((o: any) => o.status === 'DRAFT')
      setData(rfqs)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const confirmRFQ = async (id: string) => {
    setActionLoading(true)
    try {
      await PurchasingAPI.confirmRFQ(id)
      toast({ title: "RFQ Confirmed", description: "Successfully converted to a Purchase Order." })
      setSelectedDoc(null)
      fetchRFQs()
      router.push('/purchasing/orders')
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to confirm RFQ.", variant: "destructive" })
    } finally { setActionLoading(false) }
  }

  const filtered = data.filter(item =>
    item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (selectedDoc) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}><ChevronLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{selectedDoc.order_number}</h1>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">Draft RFQ</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Request for Quotation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary"><Send className="w-4 h-4 mr-2" /> Send to Supplier</Button>
            <Button onClick={() => confirmRFQ(selectedDoc.id)} disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm to Purchase Order
            </Button>
          </div>
        </div>

        <div className="flex items-center p-4 bg-muted/30 border rounded-lg overflow-x-auto text-sm font-medium gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700"><FileText className="w-4 h-4" /> RFQ / Draft</div>
          <div className="h-px bg-border flex-1 mx-1 min-w-[20px]"></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground"><CheckCircle2 className="w-4 h-4" /> Purchase Order</div>
          <div className="h-px bg-border flex-1 mx-1 min-w-[20px]"></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground">Receipt</div>
          <div className="h-px bg-border flex-1 mx-1 min-w-[20px]"></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground">Vendor Bill</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Order Lines</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30"><tr>
                    <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Qty</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Unit Price</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {(selectedDoc.items || []).length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No lines available.</td></tr>
                    ) : selectedDoc.items.map((line: any, i: number) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="p-4 font-medium">{line.product?.name || line.product_id}</td>
                        <td className="p-4 text-center">{line.qty}</td>
                        <td className="p-4 text-right">Rp {Number(line.unit_price || 0).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right font-medium">Rp {Number(line.subtotal || (line.qty * line.unit_price) || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t p-6 flex justify-end">
                <div className="w-64 text-base font-bold flex justify-between"><span>Grand Total</span><span>Rp {Number(selectedDoc.total_amount || 0).toLocaleString('id-ID')}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm h-fit">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">RFQ Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Supplier</p><p className="font-medium">{selectedDoc.supplier?.name || '-'}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Order Date</p><p className="font-medium">{new Date(selectedDoc.order_date || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Expected Receipt</p><p className="font-medium">{selectedDoc.expected_receipt ? new Date(selectedDoc.expected_receipt).toLocaleDateString('id-ID') : '-'}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request for Quotation (RFQ)</h1>
          <p className="text-muted-foreground mt-1">Manage draft purchase quotations before confirming with suppliers.</p>
        </div>
        <Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New RFQ</Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg">Draft Quotations</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search RFQ..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex p-12 justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y"><tr>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">RFQ Number</th>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">Supplier</th>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
                  <th className="p-4 px-6 text-right font-medium text-muted-foreground">Total</th>
                  <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
                </tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-12 text-muted-foreground">No RFQs found.</td></tr>
                  ) : filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setSelectedDoc(item)}>
                      <td className="p-4 px-6 font-medium text-indigo-600 dark:text-indigo-400">{item.order_number}</td>
                      <td className="p-4 px-6 font-medium">{item.supplier?.name || '-'}</td>
                      <td className="p-4 px-6 text-muted-foreground">{new Date(item.order_date || Date.now()).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 px-6 text-right font-medium">Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 px-6 text-center"><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">View</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
