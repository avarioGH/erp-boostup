"use client"
import { useState, useEffect } from "react"
import { TimberAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save, Box } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function CreateTransferPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ date: "", fromLocationId: "", toLocationId: "", notes: "" })
  const [item, setItem] = useState({ timberVariantId: "", quantityPcs: "" })

  useEffect(() => {
    InventoryAPI.getWarehouses()
      .then((res: any) => setWarehouses(Array.isArray(res) ? res : []))
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  // Fetch available stock for selected source warehouse
  useEffect(() => {
    if (form.fromLocationId) {
      TimberAPI.getTimberStock({ locationId: form.fromLocationId })
        .then((res: any) => setStocks(res.items || []))
        .catch(console.error)
    }
  }, [form.fromLocationId])

  const selectedStock = stocks.find(s => s.timberVariantId === item.timberVariantId)
  const qty = parseInt(item.quantityPcs) || 0

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!selectedStock) return toast({ title: "Error", description: "Select a valid SKU", variant: "destructive" })
    if (qty > selectedStock.currentPcs) return toast({ title: "Error", description: "Insufficient stock", variant: "destructive" })
    
    setSubmitting(true)
    try {
      const volRatio = qty / selectedStock.currentPcs
      const volumeM3 = selectedStock.currentVolumeM3 * volRatio

      const payload = {
        ...form,
        transferDate: form.date,
        items: [{
           timberVariantId: item.timberVariantId,
           quantityPcs: qty,
           volumeM3
        }]
      }
      await TimberAPI.createTransfer(payload)
      toast({ title: "Success", description: "Transfer created (DRAFT)" })
      router.push('/inventory/transfers')
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/transfers')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Stock Transfer</h1>
          <p className="text-muted-foreground mt-1">Move items between locations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Transfer Route</CardTitle></CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-sm font-medium">Date *</label><Input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Notes</label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">From Location *</label><Select value={form.fromLocationId} onValueChange={(val) => setForm({...form, fromLocationId: val || ""})}><SelectTrigger><SelectValue placeholder="Select Source..."/></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium">To Location *</label><Select value={form.toLocationId} onValueChange={(val) => setForm({...form, toLocationId: val || ""})}><SelectTrigger><SelectValue placeholder="Select Destination..."/></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {form.fromLocationId && (
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Select Item</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Stock SKU (Available in Source Location)</label>
                <Select value={item.timberVariantId} onValueChange={(val) => setItem({...item, timberVariantId: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="Select SKU to transfer..."/></SelectTrigger>
                  <SelectContent>
                    {stocks.filter(s => s.currentPcs > 0).map(s => <SelectItem key={s.timberVariantId} value={s.timberVariantId}>{s.timberVariant?.sku} (Available: {s.currentPcs} PCS)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transfer Quantity (PCS)</label>
                <Input required type="number" min="1" max={selectedStock?.currentPcs || 1} value={item.quantityPcs} onChange={e => setItem({...item, quantityPcs: e.target.value})} />
                {selectedStock && <p className="text-xs text-muted-foreground mt-1">Max available: {selectedStock.currentPcs} PCS</p>}
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={submitting || !form.fromLocationId || !form.toLocationId || !item.timberVariantId || qty <= 0 || qty > (selectedStock?.currentPcs || 0)} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
          {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Create Transfer (DRAFT)
        </Button>
      </form>
    </div>
  )
}
