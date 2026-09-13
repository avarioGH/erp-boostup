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

  // --- REUSABLE CLASS NAMES ---
  const inputClass = "bg-[#F8FAFC] dark:bg-[#111A27] border-[#E2E8F0] dark:border-[#263244] text-[#172033] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] hover:border-[#CBD5E1] dark:hover:border-[#334155] focus-visible:ring-0 focus-visible:border-[#4F6EF7] dark:focus-visible:border-[#5B7CFA] focus-visible:shadow-[0_0_0_3px_rgba(79,110,247,0.12)] dark:focus-visible:shadow-[0_0_0_3px_rgba(91,124,250,0.14)] transition-all duration-200"
  const labelClass = "text-sm font-medium text-[#172033] dark:text-[#E2E8F0]"
  const asteriskClass = "text-[#DC2626] dark:text-[#F87171]"

  return (
    <div className="space-y-6 pb-10 min-h-[calc(100vh-4rem)] bg-[#F4F6F8] dark:bg-[#0F1720] -m-4 sm:-m-6 md:-m-8 p-4 sm:p-6 md:p-8 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/logs')} className="text-[#475569] dark:text-[#CBD5E1] border-[#E2E8F0] dark:border-[#263244] bg-[#FFFFFF] dark:bg-[#151E2B] hover:bg-[#F8FAFC] dark:hover:bg-[#192333] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#172033] dark:text-[#F1F5F9]">Register Raw Log</h1>
          <p className="mt-1 text-[#94A3B8] dark:text-[#64748B]">Enter physical measurements. Volume will be calculated automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none border-[#E2E8F0] dark:border-[#263244] bg-[#FFFFFF] dark:bg-[#151E2B] transition-colors duration-200">
            <CardHeader className="border-b border-[#E2E8F0] dark:border-[#263244] bg-transparent pb-4">
              <CardTitle className="text-[16px] font-semibold text-[#172033] dark:text-[#F1F5F9]">Identity</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Log Number <span className={asteriskClass}>*</span></label>
                <Input required value={form.logNumber} onChange={e => setForm({...form, logNumber: e.target.value})} placeholder="e.g. 199" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Barcode (Optional)</label>
                <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Auto-generated if empty" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Species <span className={asteriskClass}>*</span></label>
                <Input required value={form.species} onChange={e => setForm({...form, species: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Partai / Batch</label>
                <Input value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="e.g. BATCH-01" className={inputClass} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Location</label>
                <Select value={form.locationId} onValueChange={(val) => setForm({...form, locationId: val || ""})}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFFFF] dark:bg-[#151E2B] border-[#E2E8F0] dark:border-[#263244]">
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id} className="focus:bg-[#F8FAFC] dark:focus:bg-[#192333] focus:text-[#172033] dark:focus:text-[#F1F5F9]">{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none border-[#E2E8F0] dark:border-[#263244] bg-[#FFFFFF] dark:bg-[#151E2B] transition-colors duration-200">
            <CardHeader className="border-b border-[#E2E8F0] dark:border-[#263244] bg-transparent pb-4">
              <CardTitle className="text-[16px] font-semibold text-[#172033] dark:text-[#F1F5F9]">Measurements</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-4">
                <label className={labelClass}>Original Length (meters) <span className={asteriskClass}>*</span></label>
                <Input required type="number" step="0.01" value={form.originalLength} onChange={e => setForm({...form, originalLength: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>D1 (cm) <span className={asteriskClass}>*</span></label>
                <Input required type="number" step="0.01" value={form.diameter1} onChange={e => setForm({...form, diameter1: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>D2 (cm) <span className={asteriskClass}>*</span></label>
                <Input required type="number" step="0.01" value={form.diameter2} onChange={e => setForm({...form, diameter2: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>D3 (cm) <span className={asteriskClass}>*</span></label>
                <Input required type="number" step="0.01" value={form.diameter3} onChange={e => setForm({...form, diameter3: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>D4 (cm) <span className={asteriskClass}>*</span></label>
                <Input required type="number" step="0.01" value={form.diameter4} onChange={e => setForm({...form, diameter4: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Gerowong &Oslash; (cm)</label>
                <Input type="number" step="0.01" value={form.gerowong} onChange={e => setForm({...form, gerowong: e.target.value})} className={inputClass} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={labelClass}>Trimming Length (meters)</label>
                <Input type="number" step="0.01" value={form.trimmingLength} onChange={e => setForm({...form, trimmingLength: e.target.value})} className={inputClass} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-[#A7EBD3] dark:border-[#2D6655] bg-[#F8FFFC] dark:bg-[#14231F] transition-colors duration-200">
            <CardHeader className="border-b border-[#D7F5E8] dark:border-[#25493E] pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-[#047857] dark:text-[#34D399]">
                <Calculator className="w-5 h-5 text-[#047857] dark:text-[#34D399]" /> Live Preview
              </CardTitle>
              <CardDescription className="text-[#64748B] dark:text-[#94A3B8]">Server is source of truth</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {preview.gDia > 0 && preview.gDia >= preview.rnd && (
                <div className="p-3 bg-[#FEF2F2] dark:bg-[#451A1A] text-[#DC2626] dark:text-[#F87171] text-xs rounded border border-[#FECACA] dark:border-[#7F1D1D]">
                  <strong>CRITICAL WARNING:</strong> Gerowong Diameter ({preview.gDia} cm) is &gt;= Rounded Diameter ({preview.rnd} cm). This log is completely hollow!
                </div>
              )}
              {preview.gDia > 0 && preview.gDia >= preview.rnd * 0.9 && preview.gDia < preview.rnd && (
                <div className="p-3 bg-[#FFFBEB] dark:bg-[#422006] text-[#D97706] dark:text-[#FBBF24] text-xs rounded border border-[#FEF3C7] dark:border-[#78350F]">
                  <strong>WARNING:</strong> Gerowong Diameter ({preview.gDia} cm) is &gt;= 90% of Rounded Diameter ({preview.rnd} cm). Please verify measurement.
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-[#F1F5F9] dark:bg-[#1E293B] text-[10px] rounded space-y-1 font-mono text-[#64748B] dark:text-[#94A3B8] mb-2 border border-[#E2E8F0] dark:border-[#334155]">
                  <div className="font-bold mb-1">DEV BREAKDOWN:</div>
                  <div className="flex justify-between"><span>Gross:</span><span>{preview.gross}</span></div>
                  <div className="flex justify-between"><span>- Gerowong:</span><span>{preview.gerowong}</span></div>
                  <div className="flex justify-between"><span>- Trimming:</span><span>{preview.trimming}</span></div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">Avg &Oslash;</span>
                <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{preview.avg} cm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">Rounded &Oslash;</span>
                <span className="font-bold text-lg text-[#172033] dark:text-[#F1F5F9]">{preview.rnd} cm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">Class</span>
                <span className="font-medium bg-[#D1FAE5] dark:bg-[#173B32] text-[#047857] dark:text-[#6EE7B7] border border-transparent dark:border-[#245A4D] px-2 py-0.5 rounded text-xs">
                  {preview.diaClass}
                </span>
              </div>
              <hr className="border-[#D7F5E8] dark:border-[#25493E]" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">Gross Volume</span>
                <span className="font-medium text-[#172033] dark:text-[#F1F5F9]">{preview.gross} m&sup3;</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">Net Volume</span>
                <span className="font-bold text-xl text-[#4F6EF7] dark:text-[#6B8AFF]">{preview.net > 0 ? preview.net : 0} m&sup3;</span>
              </div>
            </CardContent>
          </Card>
          
          <Button type="submit" disabled={loading || preview.net < 0} className="w-full h-12 text-lg bg-[#4F6EF7] dark:bg-[#5B7CFA] hover:bg-[#405DE0] dark:hover:bg-[#6B8AFF] active:bg-[#354FC7] dark:active:bg-[#4F6FE5] text-[#FFFFFF] border-0 transition-colors">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin text-[#FFFFFF]" /> : <Save className="w-5 h-5 mr-2 text-[#FFFFFF]" />} Save Raw Log
          </Button>
        </div>
      </form>
    </div>
  )
}
