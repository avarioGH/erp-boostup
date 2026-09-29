"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, SlidersHorizontal, ChevronLeft, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdjustmentsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters & Pagination
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => { fetchAdjustments() }, [search, status, page])

  const fetchAdjustments = async () => {
    try {
      setLoading(true)
      const res = await InventoryAPI.getAdjustments({ skip: (page - 1) * limit, take: limit, search, status })
      setData(res?.items || res?.data || [])
      setTotal(res?.total || 0)
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }

  const handlePost = async (id: string) => {
    setActionLoading(true)
    try {
      await InventoryAPI.postAdjustment(id)
      toast({ title: "Adjustment Posted", description: "Stock levels have been adjusted." })
      setSelectedDoc(null)
      fetchAdjustments()
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to post adjustment.", variant: "destructive" })
    } finally { setActionLoading(false) }
  }

  const handleCancel = async (id: string) => {
    setActionLoading(true)
    try {
      await InventoryAPI.cancelAdjustment(id)
      toast({ title: "Adjustment Cancelled", description: "The adjustment has been cancelled." })
      setSelectedDoc(null)
      fetchAdjustments()
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to cancel adjustment.", variant: "destructive" })
    } finally { setActionLoading(false) }
  }

  const fetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await InventoryAPI.getAdjustment(id)
      setSelectedDoc(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (selectedDoc) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-10 p-4 md:p-8 dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}><ChevronLeft className="h-4 w-4" /></Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold tracking-tight text-foreground">{selectedDoc.adjustmentNumber || 'Adjustment'}</h1>
                <Badge variant={selectedDoc.status === 'POSTED' ? 'default' : selectedDoc.status === 'CANCELLED' ? 'destructive' : 'secondary'}>{selectedDoc.status || 'DRAFT'}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Stock Adjustment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedDoc.status === 'DRAFT' && (
              <Button onClick={() => handlePost(selectedDoc.id)} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Post / Validate
              </Button>
            )}
            {selectedDoc.status === 'POSTED' && (
              <Button onClick={() => handleCancel(selectedDoc.id)} disabled={actionLoading} variant="destructive">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Cancel / Void
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm bg-[#0f172a] text-white border-border">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4"><CardTitle className="text-[16px] font-semibold">Adjusted Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-[600px] md:min-w-full w-full text-sm">
                  <thead className="bg-muted/30"><tr>
                    <th className="p-4 text-left font-medium text-muted-foreground">Variant SKU</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Type</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Qty Pcs</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Volume M3</th>
                  </tr></thead>
                  <tbody>
                    {(selectedDoc.items || []).length === 0 ? (
                      <tr><td colSpan={4} className="p-4 md:p-8 text-center text-muted-foreground">No items in this adjustment.</td></tr>
                    ) : selectedDoc.items.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/60 transition-colors">
                        <td className="p-4 font-medium">{item.timberVariant?.sku || '-'}</td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={item.type === 'IN' ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}>{item.type}</Badge>
                        </td>
                        <td className="p-4 text-right font-bold">{item.quantityPcs}</td>
                        <td className="p-4 text-right font-bold">{item.volumeM3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm h-fit bg-[#0f172a] text-white border-border">
            <CardHeader className="border-b border-border/50 bg-muted/10 pb-4"><CardTitle className="text-[16px] font-semibold">Adjustment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Warehouse</p><p className="font-medium text-primary">{selectedDoc.location?.name || '-'}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Date</p><p className="font-medium">{new Date(selectedDoc.adjustmentDate || selectedDoc.createdAt).toLocaleDateString('id-ID')}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Reason</p><p className="font-medium">{selectedDoc.reason || '-'}</p></div>
              <div><p className="text-sm font-medium text-muted-foreground mb-1">Notes</p><p className="font-medium text-muted-foreground text-sm">{selectedDoc.notes || '-'}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">Manual corrections for discrepancies.</p>
        </div>
        <Link href="/inventory/adjustments/create">
          <Button className="shadow-sm">New Adjustment</Button>
        </Link>
      </div>

      <Card className="shadow-sm bg-[#0f172a] text-white border-border">
        <CardHeader className="p-4 border-b border-border/50 bg-muted/10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" /> All Adjustments</CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search number..." 
                  className="pl-9 bg-background text-foreground"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/50">
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">No.</th>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">Warehouse</th>
                  <th className="p-4 px-6 text-left font-medium text-muted-foreground">Reason</th>
                  <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
                  <th className="p-4 px-6 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No adjustments found.</td></tr>
                ) : (
                  data.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4 px-6 font-bold text-foreground">{item.adjustmentNumber}</td>
                      <td className="p-4 px-6 text-foreground">{new Date(item.adjustmentDate || item.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 px-6 text-primary font-medium">{item.location?.name || '-'}</td>
                      <td className="p-4 px-6 text-muted-foreground truncate max-w-[200px]">{item.reason || '-'}</td>
                      <td className="p-4 px-6 text-center">
                        <Badge variant={item.status === 'POSTED' ? 'default' : item.status === 'CANCELLED' ? 'destructive' : 'secondary'}>{item.status}</Badge>
                      </td>
                      <td className="p-4 px-6 text-right">
                        <Button variant="outline" size="sm" onClick={() => fetchDetail(item.id)}>View Details</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Showing {data.length} of {total} items</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <div className="flex items-center px-2 text-sm">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
