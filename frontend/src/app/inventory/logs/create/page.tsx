"use client"
import { useState, useEffect, useRef } from "react"
import { TimberAPI, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save, Plus, Trash2, Calculator } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function MassCreateRawLogPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [masterForm, setMasterForm] = useState({
    species: "Ulin Lokal",
    batch: "",
    locationId: "",
    receivingDate: new Date().toISOString().substring(0,10),
  })

  // State for mass entry rows
  const [rows, setRows] = useState<any[]>([
    { id: Date.now().toString(), logNumber: "", length: "", d1: "", d2: "", d3: "", d4: "", gerowong: "" }
  ])

  // Ref for table to handle keyboard navigation
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    InventoryAPI.getWarehouses()
      .then(res => setWarehouses(Array.isArray(res) ? res : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows]
    newRows[index][field] = value
    setRows(newRows)
  }

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString() + Math.random(), logNumber: "", length: "", d1: "", d2: "", d3: "", d4: "", gerowong: "" }])
  }

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)
  }

  // Handle Tab and Enter keys for grid navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If it's the last row, add a new one
      if (rowIndex === rows.length - 1) {
        addRow();
        setTimeout(() => focusCell(rowIndex + 1, 0), 50);
      } else {
        focusCell(rowIndex + 1, colIndex);
      }
    }
  }

  const focusCell = (rowIndex: number, colIndex: number) => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll('tbody tr');
    if (rows[rowIndex]) {
      const inputs = rows[rowIndex].querySelectorAll('input');
      if (inputs[colIndex]) {
        inputs[colIndex].focus();
      }
    }
  }

  // Live Calculations
  const calculateRow = (row: any) => {
    const l = parseFloat(row.length) || 0
    const d1 = parseFloat(row.d1) || 0
    const d2 = parseFloat(row.d2) || 0
    const d3 = parseFloat(row.d3) || 0
    const d4 = parseFloat(row.d4) || 0
    const g = parseFloat(row.gerowong) || 0

    const diams = [d1, d2, d3, d4].filter(d => d > 0)
    const sumDia = diams.reduce((a, b) => a + b, 0)
    
    // Exact standard formula based on backend implementation:
    const avgDiaStrict = (d1 + d2 + d3 + d4) / 4; 
    const rndDia = Math.round(avgDiaStrict);
    
    const grossVol = l > 0 && rndDia > 0 ? (Math.pow(rndDia, 2) * l * 0.7854) / 10000 : 0
    const gerowongVol = l > 0 && g > 0 ? (Math.pow(g, 2) * l * 0.7854) / 10000 : 0
    const netVol = grossVol - gerowongVol

    return {
      avg: avgDiaStrict,
      gross: grossVol,
      hollow: gerowongVol,
      net: netVol > 0 ? netVol : 0
    }
  }

  const handleSubmit = async () => {
    if (!masterForm.locationId) {
      return toast({ title: "Validasi Gagal", description: "Warehouse harus dipilih", variant: "destructive" })
    }
    if (!masterForm.batch) {
      return toast({ title: "Validasi Gagal", description: "Partai harus diisi", variant: "destructive" })
    }

    // Filter out completely empty rows
    const validRows = rows.filter(r => r.logNumber && r.length && r.d1)
    
    if (validRows.length === 0) {
      return toast({ title: "Validasi Gagal", description: "Minimal isi 1 baris log dengan lengkap (Log No, Length, D1)", variant: "destructive" })
    }

    setSubmitting(true)
    try {
      const payloadItems = validRows.map(r => ({
        logNumber: r.logNumber,
        species: masterForm.species,
        batch: masterForm.batch,
        locationId: masterForm.locationId,
        receivingDate: masterForm.receivingDate,
        originalLength: parseFloat(r.length),
        diameter1: parseFloat(r.d1) || 0,
        diameter2: parseFloat(r.d2) || 0,
        diameter3: parseFloat(r.d3) || 0,
        diameter4: parseFloat(r.d4) || 0,
        gerowong: parseFloat(r.gerowong) || 0,
      }))

      await TimberAPI.createBulkLogs({ items: payloadItems })
      toast({ title: "Berhasil", description: `${payloadItems.length} Logs berhasil disimpan.` })
      router.push('/inventory/logs')
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Gagal menyimpan data massal.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  const totalNet = rows.reduce((acc, row) => acc + calculateRow(row).net, 0)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/logs')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">Mass Entry: Register Raw Logs</h1>
          <p className="text-muted-foreground mt-1">Input massal data kayu log berdasarkan Partai & Spesies.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-[16px] font-semibold">1. Master Data (Berlaku untuk semua baris)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Partai *</label>
            <Input placeholder="Contoh: BATCH-001" value={masterForm.batch} onChange={e => setMasterForm({...masterForm, batch: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Species *</label>
            <Select value={masterForm.species} onValueChange={v => setMasterForm({...masterForm, species: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ulin Lokal">Ulin Lokal</SelectItem>
                <SelectItem value="Ulin Impor">Ulin Impor</SelectItem>
                <SelectItem value="Meranti">Meranti</SelectItem>
                <SelectItem value="Bengkirai">Bengkirai</SelectItem>
                <SelectItem value="Kapur">Kapur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Warehouse *</label>
            <Select value={masterForm.locationId} onValueChange={v => setMasterForm({...masterForm, locationId: v})}>
              <SelectTrigger>
                {masterForm.locationId ? warehouses.find(w => w.id === masterForm.locationId)?.name : <SelectValue placeholder="Pilih Warehouse..."/>}
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Receiving Date *</label>
            <Input type="date" value={masterForm.receivingDate} onChange={e => setMasterForm({...masterForm, receivingDate: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="bg-muted/10 border-b pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[16px] font-semibold">2. Log Input Data</CardTitle>
            <CardDescription className="mt-1">Gunakan tombol TAB untuk pindah kolom, dan ENTER untuk baris baru.</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">Total Net M&sup3;:</span>
            <span className="text-xl font-bold text-primary">{totalNet.toFixed(4)}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-0 overflow-x-auto">
          <table className="min-w-full text-sm" ref={tableRef}>
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-3 text-left font-semibold text-[#526174] w-[50px]">#</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[150px]">Log No</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[100px]">Length (m)</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[80px]">D1 (cm)</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[80px]">D2 (cm)</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[80px]">D3 (cm)</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[80px]">D4 (cm)</th>
                <th className="p-3 text-left font-semibold text-[#526174] w-[100px]">Gerowong</th>
                <th className="p-3 text-right font-semibold text-[#526174] bg-muted/50">&Oslash; Avg</th>
                <th className="p-3 text-right font-semibold text-[#526174] bg-muted/50">Gross</th>
                <th className="p-3 text-right font-semibold text-[#526174] bg-muted/50">Net M&sup3;</th>
                <th className="p-3 text-center font-semibold text-[#526174] w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const calc = calculateRow(row)
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-2 px-3 text-center text-muted-foreground font-medium">{idx + 1}</td>
                    <td className="p-2 px-3"><Input className="h-8 rounded-sm bg-background" value={row.logNumber} onChange={e => handleRowChange(idx, 'logNumber', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 0)} /></td>
                    <td className="p-2 px-3"><Input type="number" step="0.1" className="h-8 rounded-sm bg-background" value={row.length} onChange={e => handleRowChange(idx, 'length', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 1)} /></td>
                    <td className="p-2 px-3"><Input type="number" className="h-8 rounded-sm bg-background" value={row.d1} onChange={e => handleRowChange(idx, 'd1', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 2)} /></td>
                    <td className="p-2 px-3"><Input type="number" className="h-8 rounded-sm bg-background" value={row.d2} onChange={e => handleRowChange(idx, 'd2', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 3)} /></td>
                    <td className="p-2 px-3"><Input type="number" className="h-8 rounded-sm bg-background" value={row.d3} onChange={e => handleRowChange(idx, 'd3', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 4)} /></td>
                    <td className="p-2 px-3"><Input type="number" className="h-8 rounded-sm bg-background" value={row.d4} onChange={e => handleRowChange(idx, 'd4', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 5)} /></td>
                    <td className="p-2 px-3"><Input type="number" className="h-8 rounded-sm bg-background" value={row.gerowong} onChange={e => handleRowChange(idx, 'gerowong', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 6)} /></td>
                    
                    <td className="p-2 px-3 text-right font-medium text-muted-foreground bg-muted/10">{calc.avg.toFixed(1)}</td>
                    <td className="p-2 px-3 text-right font-medium text-muted-foreground bg-muted/10">{calc.gross.toFixed(3)}</td>
                    <td className="p-2 px-3 text-right font-bold text-primary bg-muted/10">{calc.net.toFixed(3)}</td>
                    <td className="p-2 px-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={() => removeRow(idx)} disabled={rows.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="p-4 border-t bg-muted/5">
            <Button variant="outline" onClick={addRow} className="w-full border-dashed bg-background">
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris (Enter)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" className="w-32" onClick={() => router.push('/inventory/logs')}>Batal</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="w-48">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Semua Data
        </Button>
      </div>
    </div>
  )
}