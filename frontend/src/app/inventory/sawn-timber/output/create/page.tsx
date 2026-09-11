"use client"
import { useState, useEffect } from "react"
import { TimberAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save, Calculator } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function CreateOutputPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [inputLogs, setInputLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ date: "", shift: "1", locationId: "", inputLogId: "", batch: "", notes: "" })
  const [item, setItem] = useState({ grade: "A", thickness: "", width: "", length: "", quantityPcs: "" })
  const [preview, setPreview] = useState(0)

  useEffect(() => {
    Promise.all([
      InventoryAPI.getWarehouses(),
      TimberAPI.getInputLogs({ status: "IN_PROCESS" }).catch(() => ({ items: [] }))
    ]).then(([wRes, lRes]) => {
      setWarehouses(Array.isArray(wRes) ? wRes : [])
      setInputLogs(Array.isArray(lRes?.items) ? lRes.items : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = parseFloat(item.thickness) || 0
    const w = parseFloat(item.width) || 0
    const l = parseFloat(item.length) || 0
    const q = parseInt(item.quantityPcs) || 0
    const vol = (t * w * l * q) / 1000000000
    setPreview(vol)
  }, [item])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.inputLogId) { toast({ title: "Error", description: "Source Input Log is required", variant: "destructive" }); return; }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        outputDate: form.date,
        items: [{
           grade: item.grade,
           thickness: parseFloat(item.thickness),
           width: parseFloat(item.width),
           length: parseFloat(item.length),
           quantityPcs: parseInt(item.quantityPcs)
        }]
      }
      await TimberAPI.createSawnOutput(payload)
      toast({ title: "Success", description: "Output created successfully. (DRAFT)" })
      router.push('/inventory/sawn-timber/output')
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
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/sawn-timber/output')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Sawn Timber Output</h1>
          <p className="text-muted-foreground mt-1">Create a production output bundle.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Operation Details</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Source Input Log *</label>
                <Select value={form.inputLogId} onValueChange={(val) => setForm({...form, inputLogId: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="Select IN_PROCESS Input Log..."/></SelectTrigger>
                  <SelectContent>
                    {inputLogs.map(l => <SelectItem key={l.id} value={l.id}>{l.inputNumber} ({l.species})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Date *</label><Input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Shift</label><Select value={form.shift} onValueChange={(val) => setForm({...form, shift: val || "1"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1">Shift 1</SelectItem><SelectItem value="2">Shift 2</SelectItem><SelectItem value="3">Shift 3</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-sm font-medium">Warehouse *</label><Select value={form.locationId} onValueChange={(val) => setForm({...form, locationId: val || ""})}><SelectTrigger><SelectValue placeholder="Select Warehouse..."/></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><label className="text-sm font-medium">Partai</label><Input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} /></div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Output Product (Size & Grade)</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">Thickness (mm) *</label><Input required type="number" min="1" value={item.thickness} onChange={e => setItem({...item, thickness: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Width (mm) *</label><Input required type="number" min="1" value={item.width} onChange={e => setItem({...item, width: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Length (mm) *</label><Input required type="number" min="1" value={item.length} onChange={e => setItem({...item, length: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Grade</label><Select value={item.grade} onValueChange={(val) => setItem({...item, grade: val || "A"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="A">Grade A</SelectItem><SelectItem value="B">Grade B</SelectItem><SelectItem value="C">Grade C</SelectItem></SelectContent></Select></div>
              <div className="space-y-2 md:col-span-4"><label className="text-sm font-medium">Quantity (PCS) *</label><Input required type="number" min="1" value={item.quantityPcs} onChange={e => setItem({...item, quantityPcs: e.target.value})} /></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border border-primary/20 bg-card">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Calculator className="w-5 h-5"/> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dimensions</span>
                <span className="font-bold text-foreground">
                  {item.thickness || 0} &times; {item.width || 0} &times; {item.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <span className="font-medium text-foreground">{item.quantityPcs || 0} PCS</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Calculated M&sup3;</span>
                <span className="font-bold text-2xl text-primary">
                  {preview > 0 ? preview.toFixed(6) : "0"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Button
            type="submit"
            disabled={submitting || preview <= 0 || !form.inputLogId}
            className="w-full h-12 text-lg"
          >
            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Create Output (DRAFT)
          </Button>
        </div>
      </form>
    </div>
  )
}
