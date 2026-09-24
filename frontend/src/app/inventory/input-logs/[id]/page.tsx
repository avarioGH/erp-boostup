"use client"
import { useState, useEffect, use } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Box, Waypoints, CheckCircle2, Factory, Calendar, Package, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function InputLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    TimberAPI.getInputLog(id)
      .then(setData)
      .catch((err: any) => setError(err?.response?.data?.message || "Gagal memuat data input log"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 md:p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  if (error || !data) return (
    <div className="p-8 md:p-24 flex flex-col items-center justify-center gap-4 text-center">
      <Package className="w-10 h-10 text-muted-foreground opacity-40" />
      <p className="text-base font-semibold text-foreground">{error || "Input log tidak ditemukan."}</p>
      <Button variant="outline" onClick={() => router.push("/inventory/input-logs")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
      </Button>
    </div>
  )

 return (
 <div className="space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-500 pb-8 px-4 md:px-6 box-border">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.push('/inventory/input-logs')}><ArrowLeft className="w-4 h-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.inputNumber}</h1>
 <Badge variant={data.status ==="AVAILABLE" ?"default" :"secondary"}>{data.status}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Factory className="w-4 h-4" /> Input Log (WIP) ï¿½ {data.species}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
    <Button variant="default" onClick={() => window.open(`/inventory/input-logs/${id}/print`, "_blank")}><Printer className="w-4 h-4 mr-2" /> Print Tally</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="bg-card rounded-xl border border-border shadow-sm">
 <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10"><CardTitle className="text-[16px] font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operation</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
 <div><p className="text-muted-foreground">Date</p><p className="font-bold flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(data.date).toLocaleDateString("id-ID")}</p></div>
 <div><p className="text-muted-foreground">Shift</p><p className="font-bold">{data.shift ||"-"}</p></div>
 <div><p className="text-muted-foreground">Machine</p><p className="font-bold">MSAW-{data.machine ||"1"}</p></div>
 <div><p className="text-muted-foreground">Partai</p><p className="font-bold">{data.batch ||"-"}</p></div>
 </div>
 </CardContent>
 </Card>

 <Card className="bg-card rounded-xl border border-border shadow-sm">
 <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10"><CardTitle className="text-lg flex items-center gap-2 text-foreground"><Box className="w-4 h-4" /> Volume Summary</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Pieces</span><span className="font-bold text-lg">{data.totalQty} PCS</span></div>
 <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Length</span><span className="font-medium">{data.totalLength?.toFixed(2)} m</span></div>
 <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Gross</span><span className="font-medium">{data.totalGross?.toFixed(4)} m?</span></div>
 <hr className="border-border/50" />
 <div className="flex justify-between items-center"><span className="font-bold text-foreground font-bold">Total Net Volume</span><span className="font-bold text-2xl text-primary">{data.totalVolume?.toFixed(4)} m?</span></div>
 </CardContent>
 </Card>

 <Card className="bg-card rounded-xl border border-border shadow-sm">
 <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10"><CardTitle className="text-[16px] font-semibold flex items-center gap-2"><Waypoints className="w-4 h-4" /> Traceability</CardTitle></CardHeader>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4 text-sm">
 <div className="p-4 border rounded text-muted-foreground border-dashed">
 <p className="font-medium flex items-center gap-2"><Box className="w-4 h-4" /> TRIMMED LOGS</p>
 <p className="text-xs">{data.totalQty} sources</p>
 </div>
 <div className="h-px bg-border flex-1 mx-2"></div>
 <div className="p-4 border rounded bg-primary/5 border-primary/20">
 <p className="font-bold text-foreground flex items-center gap-2"><Factory className="w-4 h-4" /> INPUT LOG</p>
 <p className="text-xs text-muted-foreground">{data.inputNumber}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="bg-card rounded-xl border border-border shadow-sm">
 <CardHeader className="p-4 md:p-5 border-b border-border/50 bg-muted/10">
 <CardTitle className="text-[16px] font-semibold">Source Material (Trimmed Logs)</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto w-full max-w-[100vw] sm:max-w-none">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="p-3 px-6 text-left">Trim Code</th>
 <th className="p-3 px-6 text-left">Parent Raw Log</th>
 <th className="p-3 px-6 text-right">Length</th>
 <th className="p-3 px-6 text-right">Avg ?</th>
 <th className="p-3 px-6 text-right">Gross M?</th>
 <th className="p-3 px-6 text-right">Net M?</th>
 </tr>
 </thead>
 <tbody>
 {data.items?.map((item: any) => (
 <tr key={item.id} className="border-b hover:bg-muted/60 transition-colors">
 <td className="p-3 px-6 font-medium text-primary">
 <Link href={`/inventory/trimming/${item.trimmedLogId}`} className="hover:underline">{item.trimmedLog?.trimNumber}</Link>
 </td>
 <td className="p-3 px-6 text-primary">
 <Link href={`/inventory/logs/${item.trimmedLog?.rawLogId}`} className="hover:underline">{item.trimmedLog?.rawLog?.logNumber}</Link>
 </td>
 <td className="p-3 px-6 text-right">{item.trimmedLog?.length} m</td>
 <td className="p-3 px-6 text-right">{item.trimmedLog?.averageDiameter} cm</td>
 <td className="p-3 px-6 text-right">{item.trimmedLog?.grossVolume}</td>
 <td className="p-3 px-6 text-right font-bold">{item.trimmedLog?.netVolume}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}




