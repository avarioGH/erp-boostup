import os

file_path = "frontend/src/app/purchasing/orders/page.tsx"

new_code = """\"use client\"
import { useEffect, useState } from 'react'
import { api, PurchasingAPI, VendorAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Filter, ChevronLeft, Send, CheckCircle2, FileText, Download, Truck, FileOutput } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
  
  // detail state
  const [docLoading, setDocLoading] = useState(false)
  const [docDetails, setDocDetails] = useState<any | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/purchasing/orders', { params: { page: 1, limit: 100 } })
      // Filter out RFQs if backend uses the same model. DRAFT is RFQ, CONFIRMED/CANCELLED is PO.
      // But let's just display all or rely on backend. For this view, we want POs (CONFIRMED mostly, but could be DRAFT PO).
      const allOrders = res?.data || []
      setData(allOrders.filter((o: any) => o.status !== 'DRAFT')) // DRAFT belongs to RFQ page
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = async (doc: any) => {
    setSelectedDoc(doc)
    setDocLoading(true)
    try {
      const res = await api.get(`/purchasing/orders/${doc.id}`)
      setDocDetails(res.data || res)
    } catch(e) {
      console.error(e)
      setDocDetails(doc) // fallback
    } finally {
      setDocLoading(false)
    }
  }

  const createVendorBill = async () => {
    if (!selectedDoc) return
    try {
      setDocLoading(true)
      await VendorAPI.createVendorBill(selectedDoc.id)
      await fetchOrders()
      router.push("/finance/vendor-bills")
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to create vendor bill.")
    } finally {
      setDocLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary" className="bg-slate-100 text-slate-700">Draft (RFQ)</Badge>
      case 'CONFIRMED': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Confirmed</Badge>
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReceiptBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <Badge variant="outline" className="text-amber-600 border-amber-200">Pending Receipt</Badge>
      case 'PARTIAL': return <Badge variant="outline" className="text-blue-600 border-blue-200">Partially Received</Badge>
      case 'RECEIVED': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Fully Received</Badge>
      default: return null
    }
  }

  const getBillBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <Badge variant="outline" className="text-amber-600 border-amber-200">Unbilled</Badge>
      case 'BILLED': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Billed</Badge>
      default: return null
    }
  }

  const filtered = data.filter(item => 
    item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (selectedDoc) {
    const details = docDetails || selectedDoc
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{details.order_number}</h1>
                {getStatusBadge(details.status)}
              </div>
              <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
                <FileText className="h-4 w-4" /> Purchase Order
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
            
            {details.status === 'CONFIRMED' && details.receipt_status !== 'RECEIVED' && (
              <Button onClick={() => router.push(`/purchasing/receipts?po=${details.id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Truck className="w-4 h-4 mr-2" /> Receive Goods
              </Button>
            )}
            
            {details.status === 'CONFIRMED' && details.receipt_status !== 'PENDING' && details.bill_status !== 'BILLED' && (
              <Button onClick={createVendorBill} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                <FileOutput className="w-4 h-4 mr-2" /> Create Vendor Bill
              </Button>
            )}

            {details.bill_status === 'BILLED' && (
              <Button onClick={() => router.push("/finance/vendor-bills")} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                <FileText className="w-4 h-4 mr-2" /> View Bill
              </Button>
            )}
          </div>
        </div>

        {/* Workflow Ribbon UX */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg overflow-x-auto text-sm font-medium">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300`}>
             <CheckCircle2 className="w-4 h-4" /> Request / RFQ
           </div>
           <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
             <CheckCircle2 className="w-4 h-4" /> Purchase Order
           </div>
           <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.receipt_status === 'RECEIVED' || details.receipt_status === 'PARTIAL' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}`}>
             <Truck className="w-4 h-4" /> Receipt
           </div>
           <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.bill_status === 'BILLED' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}`}>
             <FileOutput className="w-4 h-4" /> Vendor Bill
           </div>
        </div>

        {docLoading && !docDetails ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-lg">Order Lines (Three-Way Match)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
                        <th className="p-4 text-center font-medium text-muted-foreground">Ordered</th>
                        <th className="p-4 text-center font-medium text-muted-foreground">Received</th>
                        <th className="p-4 text-center font-medium text-muted-foreground">Billed</th>
                        <th className="p-4 text-right font-medium text-muted-foreground">Unit Price</th>
                        <th className="p-4 text-right font-medium text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(details.items || []).length === 0 ? (
                        <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No lines available.</td></tr>
                      ) : (
                        details.items.map((line: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-4">
                              <p className="font-medium">{line.product?.name || line.product_id}</p>
                            </td>
                            <td className="p-4 text-center font-medium">{line.qty}</td>
                            <td className="p-4 text-center text-indigo-600 font-medium">{line.received_qty || 0}</td>
                            <td className="p-4 text-center text-emerald-600 font-medium">{line.billed_qty || 0}</td>
                            <td className="p-4 text-right">Rp {Number(line.unit_price || 0).toLocaleString('id-ID')}</td>
                            <td className="p-4 text-right font-medium">Rp {Number(line.subtotal || (line.qty * line.unit_price) || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="border-t bg-muted/10 p-6 flex flex-col items-end space-y-2">
                  <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2">
                    <span>Grand Total</span>
                    <span>Rp {Number(details.total_amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm h-fit">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-lg">Procurement Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Supplier</p>
                  <p className="font-medium">{details.supplier?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{details.supplier?.email || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Order Date</p>
                  <p className="font-medium">{new Date(details.order_date || details.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expected Receipt</p>
                  <p className="font-medium">{details.expected_receipt ? new Date(details.expected_receipt).toLocaleDateString('id-ID') : '-'}</p>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Receipt Status:</span>
                    {getReceiptBadge(details.receipt_status)}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Billing Status:</span>
                    {getBillBadge(details.bill_status)}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="outline">{details.payment_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage confirmed procurement orders and track fulfillment.</p>
        </div>
        <Button className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="w-4 h-4 mr-2" /> New Order</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg">Purchase Order Database</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search PO or Supplier..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex p-12 justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y">
                  <tr>
                    <th className="p-4 px-6 text-left font-medium text-muted-foreground">PO Number</th>
                    <th className="p-4 px-6 text-left font-medium text-muted-foreground">Supplier</th>
                    <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
                    <th className="p-4 px-6 text-right font-medium text-muted-foreground">Total</th>
                    <th className="p-4 px-6 text-center font-medium text-muted-foreground">Receipt</th>
                    <th className="p-4 px-6 text-center font-medium text-muted-foreground">Billing</th>
                    <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-12 text-muted-foreground">No purchase orders found.</td></tr>
                  ) : filtered.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewDetails(item)}>
                      <td className="p-4 px-6 font-medium text-indigo-600 dark:text-indigo-400">{item.order_number}</td>
                      <td className="p-4 px-6 font-medium">{item.supplier?.name || '-'}</td>
                      <td className="p-4 px-6 text-muted-foreground">{new Date(item.order_date || item.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 px-6 text-right font-medium">Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}</td>
                      <td className="p-4 px-6 text-center">{getReceiptBadge(item.receipt_status)}</td>
                      <td className="p-4 px-6 text-center">{getBillBadge(item.bill_status)}</td>
                      <td className="p-4 px-6 text-center">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </Button>
                      </td>
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
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_code)

print("Updated Purchase Orders UI")
