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

export default function CreateRawLogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    logNumber: "",
    species: "Ulin Lokal",
    batch: "",
    locationId: "",
    originalLength: "",
    diameter1: "",
    diameter2: "",
    diameter3: "",
    diameter4: "",
    gerowong: "",
    trimmingLength: "",
    barcode: ""
  })

  // Live preview
  const [preview, setPreview] = useState({ avg: 0, rnd: 0, gross: 0, gerowong: 0, trimming: 0, net: 0, diaClass: "", gDia: 0 })

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(Array.isArray(res) ? res : [])).catch(console.error)
  }, [])

  useEffect(() => {
    // Live preview calculations (Mirroring TimberCalculationService purely for UI UX)
    const d1 = parseFloat(form.diameter1.toString().replace(",", ".")) || 0;
    const d2 = parseFloat(form.diameter2.toString().replace(",", ".")) || 0;
    const d3 = parseFloat(form.diameter3.toString().replace(",", ".")) || 0;
    const d4 = parseFloat(form.diameter4.toString().replace(",", ".")) || 0;
    const len = parseFloat(form.originalLength.toString().replace(",", ".")) || 0;
    const gDia = parseFloat(form.gerowong.toString().replace(",", ".")) || 0;
    const tLen = parseFloat(form.trimmingLength.toString().replace(",", ".")) || 0;

    const avg = (d1 + d2 + d3 + d4) / 4;
    const rnd = Math.round(avg);
    
    let diaClass = "100 Cm Up";
    if (rnd < 40) diaClass = "30 - 39 Cm";
    else if (rnd < 50) diaClass = "40 - 49 Cm";
    else if (rnd < 60) diaClass = "50 - 59 Cm";
    else if (rnd < 70) diaClass = "60 - 69 Cm";
    else if (rnd < 80) diaClass = "70 - 79 Cm";
    else if (rnd < 90) diaClass = "80 - 89 Cm";
    else if (rnd < 100) diaClass = "90 - 99 Cm";

    const grossRaw = (Math.pow(rnd, 2) * len * 0.7854) / 10000;
    const gross = Math.round(grossRaw * 100) / 100;
    
    const gVolRaw = (Math.pow(gDia, 2) * (len - tLen) * 0.7854) / 10000;
    const gVol = Math.round(gVolRaw * 100) / 100;
    
    const tVolRaw = (Math.pow(rnd, 2) * tLen * 0.7854) / 10000;
    const tVol = Math.round(tVolRaw * 100) / 100;
    
    const netRaw = gross - gVol - tVol;
    const net = Math.round(netRaw * 100) / 100;

    setPreview({
      avg: Math.round(avg * 100) / 100,
      rnd,
      diaClass,
      gross,
      gerowong: gVol,
      trimming: tVol,
      net,
      gDia
    })
  }, [form])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      await TimberAPI.createRawLog({
        ...form,
        originalLength: parseFloat(form.originalLength.toString().replace(",", ".")),
        diameter1: parseFloat(form.diameter1.toString().replace(",", ".")),
        diameter2: parseFloat(form.diameter2.toString().replace(",", ".")),
        diameter3: parseFloat(form.diameter3.toString().replace(",", ".")),
        diameter4: parseFloat(form.diameter4.toString().replace(",", ".")),
        gerowong: form.gerowong ? parseFloat(form.gerowong.toString().replace(",", ".")) : null,
        trimmingLength: form.trimmingLength ? parseFloat(form.trimmingLength.toString().replace(",", ".")) : null
      })
      toast({ title: "Success", description: "Raw log registered successfully." })
      router.push('/inventory/logs')
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create log.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/logs')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register Raw Log</h1>
          <p className="text-muted-foreground mt-1">Enter physical measurements. Volume will be calculated automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Identity</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">Log Number *</label><Input required value={form.logNumber} onChange={e => setForm({...form, logNumber: e.target.value})} placeholder="e.g. 199" /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Barcode (Optional)</label><Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Auto-generated if empty" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">Species *</label><Input required value={form.species} onChange={e => setForm({...form, species: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Partai / Batch</label><Input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="e.g. BATCH-01" /></div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={form.locationId} onValueChange={(val) => setForm({...form, locationId: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Measurements</CardTitle></CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-4"><label className="text-sm font-medium text-red-600">Original Length (meters) *</label><Input required type="number" step="0.01" value={form.originalLength} onChange={e => setForm({...form, originalLength: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">D1 (cm) *</label><Input required type="number" step="0.01" value={form.diameter1} onChange={e => setForm({...form, diameter1: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">D2 (cm) *</label><Input required type="number" step="0.01" value={form.diameter2} onChange={e => setForm({...form, diameter2: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">D3 (cm) *</label><Input required type="number" step="0.01" value={form.diameter3} onChange={e => setForm({...form, diameter3: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-red-600">D4 (cm) *</label><Input required type="number" step="0.01" value={form.diameter4} onChange={e => setForm({...form, diameter4: e.target.value})} /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Gerowong Ø (cm)</label><Input type="number" step="0.01" value={form.gerowong} onChange={e => setForm({...form, gerowong: e.target.value})} /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium">Trimming Length (meters)</label><Input type="number" step="0.01" value={form.trimmingLength} onChange={e => setForm({...form, trimmingLength: e.target.value})} /></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
            <CardHeader className="border-b border-emerald-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800"><Calculator className="w-5 h-5" /> Live Preview</CardTitle>
              <CardDescription>Server is source of truth</CardDescription>
            </CardHeader>
                          <CardContent className="pt-6 space-y-4">
                {preview.gDia > 0 && preview.gDia >= preview.rnd && (
                  <div className="p-3 bg-red-100 text-red-800 text-xs rounded border border-red-200">
                    <strong>CRITICAL WARNING:</strong> Gerowong Diameter ({preview.gDia} cm) is &gt;= Rounded Diameter ({preview.rnd} cm). This log is completely hollow!
                  </div>
                )}
                {preview.gDia > 0 && preview.gDia >= preview.rnd * 0.9 && preview.gDia < preview.rnd && (
                  <div className="p-3 bg-amber-100 text-amber-800 text-xs rounded border border-amber-200">
                    <strong>WARNING:</strong> Gerowong Diameter ({preview.gDia} cm) is &gt;= 90% of Rounded Diameter ({preview.rnd} cm). Please verify measurement.
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <div className="p-2 bg-slate-100 text-[10px] rounded space-y-1 font-mono text-slate-600 mb-2">
                    <div className="font-bold mb-1">DEV BREAKDOWN:</div>
                    <div className="flex justify-between"><span>Gross:</span><span>{preview.gross}</span></div>
                    <div className="flex justify-between"><span>- Gerowong:</span><span>{preview.gerowong}</span></div>
                    <div className="flex justify-between"><span>- Trimming:</span><span>{preview.trimming}</span></div>
                  </div>
                )}
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Avg Ø</span><span className="font-medium">{preview.avg} cm</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Rounded Ø</span><span className="font-bold text-lg">{preview.rnd} cm</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Class</span><span className="font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">{preview.diaClass}</span></div>
              <hr className="border-emerald-100" />
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Gross Volume</span><span className="font-medium">{preview.gross} m³</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground text-red-500">Net Volume</span><span className="font-bold text-xl text-indigo-700">{preview.net > 0 ? preview.net : 0} m³</span></div>
            </CardContent>
          </Card>
          
          <Button type="submit" disabled={loading || preview.net < 0} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} Save Raw Log
          </Button>
        </div>
      </form>
    </div>
  )
}







