"use client"
import { useState, useEffect } from "react"
import { ProductionAPI, TimberAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function CreateProductionPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stocks, setStocks] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  const [form, setForm] = useState({ date: "", type: "GESEK", notes: "" })
  const [inputs, setInputs] = useState<any[]>([])
  const [outputs, setOutputs] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      TimberAPI.getTimberStock().catch(() => ({ items: [] })),
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([sRes, pRes]: any) => {
      setStocks(Array.isArray(sRes?.items) ? sRes.items : (Array.isArray(sRes) ? sRes : []))
      setProducts(Array.isArray(pRes) ? pRes : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const addInput = () => {
    setInputs([...inputs, { timberStockId: "", quantity: 1 }])
  }

  const addOutput = () => {
    setOutputs([...outputs, { variantId: "", type: "PRODUCT", quantity: 1, remarks: "" }])
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.date) return toast({ title: "Validasi Gagal", description: "Tanggal harus diisi", variant: "destructive" })
    if (inputs.length === 0) return toast({ title: "Validasi Gagal", description: "Minimal 1 input", variant: "destructive" })
    if (outputs.length === 0) return toast({ title: "Validasi Gagal", description: "Minimal 1 output", variant: "destructive" })

    setSubmitting(true)
    try {
      const payload = {
        date: form.date,
        type: form.type,
        notes: form.notes,
        inputs: inputs.map(i => ({ timberStockId: i.timberStockId, quantity: parseInt(i.quantity) })),
        outputs: outputs.map(o => ({ variantId: o.variantId, type: o.type, quantity: parseInt(o.quantity), remarks: o.remarks }))
      }
      await ProductionAPI.createProcess(payload)
      toast({ title: "Berhasil", description: "Production Process berhasil dibuat" })
      router.push('/inventory/production')
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Gagal menyimpan", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/production')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Create Production Process</h1>
          <p className="text-muted-foreground mt-1">Record a new production activity (Gesek, Plat, Masak).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-[16px]">General Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select value={form.type} onValueChange={(val) => setForm({...form, type: val || ""})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GESEK">GESEK</SelectItem>
                  <SelectItem value="PLAT">PLAT</SelectItem>
                  <SelectItem value="MASAK">MASAK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional remarks..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/10 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[16px]">Inputs (Timber Stock)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addInput}><Plus className="w-4 h-4 mr-2"/> Add Input</Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {inputs.map((inp, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Select value={inp.timberStockId} onValueChange={(val) => {
                  const newInputs = [...inputs]; newInputs[idx].timberStockId = val || ""; setInputs(newInputs);
                }}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select Timber Stock..."/></SelectTrigger>
                  <SelectContent>
                    {stocks.map(s => <SelectItem key={s.id} value={s.id}>{s.bundleNumber || s.id} - {s.timberVariant?.sku || 'Unknown'} (Qty: {s.quantityPcs})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" value={inp.quantity} onChange={(e) => {
                  const newInputs = [...inputs]; newInputs[idx].quantity = e.target.value; setInputs(newInputs);
                }} className="w-24" placeholder="Qty" required />
                <Button type="button" variant="ghost" size="icon" onClick={() => setInputs(inputs.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive"/></Button>
              </div>
            ))}
            {inputs.length === 0 && <p className="text-sm text-muted-foreground">No inputs added.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/10 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[16px]">Outputs</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addOutput}><Plus className="w-4 h-4 mr-2"/> Add Output</Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {outputs.map((out, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-md">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs">Product Variant *</label>
                  <Select value={out.variantId} onValueChange={(val) => {
                    const newOutputs = [...outputs]; newOutputs[idx].variantId = val || ""; setOutputs(newOutputs);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select Product..."/></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-32 space-y-2">
                  <label className="text-xs">Type *</label>
                  <Select value={out.type} onValueChange={(val) => {
                    const newOutputs = [...outputs]; newOutputs[idx].type = val || ""; setOutputs(newOutputs);
                  }}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">PRODUCT</SelectItem>
                      <SelectItem value="WASTE">WASTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-24 space-y-2">
                  <label className="text-xs">Qty *</label>
                  <Input type="number" min="1" value={out.quantity} onChange={(e) => {
                    const newOutputs = [...outputs]; newOutputs[idx].quantity = e.target.value; setOutputs(newOutputs);
                  }} required />
                </div>
                <div className="w-full sm:w-1/4 space-y-2">
                  <label className="text-xs">Remarks</label>
                  <Input value={out.remarks} onChange={(e) => {
                    const newOutputs = [...outputs]; newOutputs[idx].remarks = e.target.value; setOutputs(newOutputs);
                  }} />
                </div>
                <Button type="button" variant="ghost" size="icon" className="mt-6" onClick={() => setOutputs(outputs.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive"/></Button>
              </div>
            ))}
            {outputs.length === 0 && <p className="text-sm text-muted-foreground">No outputs added.</p>}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg" disabled={submitting}>
          {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Create Process
        </Button>
      </form>
    </div>
  )
}
