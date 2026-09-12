"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { Loader2, ArrowLeft, Ruler, Box, Waypoints, CheckCircle2, Factory } from"lucide-react"
import { useRouter } from"next/navigation"
import Link from"next/link"

export default function TrimmedLogDetailPage({ params }: { params: { id: string } }) {
 const router = useRouter()
 const [data, setData] = useState<any>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 TimberAPI.getTrimmedLog(params.id).then(setData).catch(console.error).finally(() => setLoading(false))
 }, [params.id])

 if (loading) return <div className="p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
 if (!data) return <div className="p-24 text-center">Trimmed log not found.</div>

 return (
 <div className="space-y-6 pb-10">
 <div className="flex items-center justify-between gap-4 border-b pb-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold tracking-tight text-emerald-800">{data.trimNumber}</h1>
 <Badge variant={data.status ==="AVAILABLE" ?"default" :"secondary"} className={data.status ==="AVAILABLE" ?"bg-emerald-500" :""}>{data.status}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Factory className="w-4 h-4" /> Trimmed Timber Log ? {data.species}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline">Print Barcode</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-[16px] font-semibold flex items-center gap-2"><Ruler className="w-4 h-4" /> Measurements</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-y-4">
 <div><p className="text-muted-foreground">Length</p><p className="font-bold">{data.length} m</p></div>
 <div><p className="text-muted-foreground">Parent Class</p><p className="font-bold">{data.rawLog?.diameterClass}</p></div>
 <div><p className="text-muted-foreground">Avg ?</p><p className="font-bold">{data.averageDiameter} cm</p></div>
 <div><p className="text-muted-foreground">Rounded ?</p><p className="font-bold text-lg text-primary">{data.roundedDiameter} cm</p></div>
 </div>
 <hr />
 <div className="grid grid-cols-4 gap-2 text-center text-xs">
 <div className="bg-muted/50 p-2 rounded"><span className="block text-muted-foreground">D1</span><span className="font-medium">{data.diameter1}</span></div>
 <div className="bg-muted/50 p-2 rounded"><span className="block text-muted-foreground">D2</span><span className="font-medium">{data.diameter2}</span></div>
 <div className="bg-muted/50 p-2 rounded"><span className="block text-muted-foreground">D3</span><span className="font-medium">{data.diameter3}</span></div>
 <div className="bg-muted/50 p-2 rounded"><span className="block text-muted-foreground">D4</span><span className="font-medium">{data.diameter4}</span></div>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm border-indigo-100">
 <CardHeader className="border-b bg-indigo-50/50 pb-4"><CardTitle className="text-lg flex items-center gap-2 text-indigo-800"><Box className="w-4 h-4" /> Volume Calculation</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="flex justify-between items-center"><span className="text-muted-foreground">Gross Volume</span><span className="font-medium">{data.grossVolume} m?</span></div>
 <div className="flex justify-between items-center"><span className="text-muted-foreground text-red-500">Gerowong Volume</span><span>- {data.hollowVolume || 0} m?</span></div>
 <div className="flex justify-between items-center"><span className="text-muted-foreground text-amber-500">Trimming Volume</span><span>- {data.trimmingVolume || 0} m?</span></div>
 <hr className="border-indigo-100" />
 <div className="flex justify-between items-center"><span className="font-bold text-indigo-900">Net Volume</span><span className="font-bold text-2xl text-primary">{data.netVolume} m?</span></div>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-[16px] font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Identity & Location</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div><p className="text-muted-foreground mb-1">Barcode / System ID</p><p className="font-mono bg-muted p-1.5 rounded text-xs">{data.barcode}</p></div>
 <div><p className="text-muted-foreground mb-1">Parent Raw Log</p><Link href={`/inventory/logs/${data.rawLogId}`} className="font-bold text-primary hover:underline">{data.rawLog?.logNumber}</Link></div>
 <div><p className="text-muted-foreground mb-1">Location</p><p className="font-medium text-blue-700">{data.location?.name ||"-"}</p></div>
 <div><p className="text-muted-foreground mb-1">Created At</p><p className="font-medium">{new Date(data.createdAt).toLocaleDateString("id-ID")}</p></div>
 </CardContent>
 </Card>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="border-b pb-4"><CardTitle className="text-[16px] font-semibold flex items-center gap-2"><Waypoints className="w-4 h-4" /> Traceability</CardTitle></CardHeader>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4 text-sm">
 <Link href={`/inventory/logs/${data.rawLogId}`} className="p-4 border rounded hover:border-emerald-500 transition-colors cursor-pointer block">
 <p className="font-medium text-muted-foreground flex items-center gap-2"><Box className="w-4 h-4" /> PARENT RAW LOG</p>
 <p className="text-xs">{data.rawLog?.logNumber}</p>
 </Link>
 <div className="h-px bg-border flex-1 mx-2"></div>
 <div className="p-4 border rounded bg-emerald-50 border-emerald-200">
 <p className="font-bold text-emerald-800 flex items-center gap-2"><Factory className="w-4 h-4" /> TRIMMED LOG</p>
 <p className="text-xs text-muted-foreground">{data.trimNumber}</p>
 </div>
 <div className="h-px bg-border flex-1 mx-2"></div>
 <div className="p-4 border rounded text-muted-foreground border-dashed">
 <p className="font-medium flex items-center gap-2"><Box className="w-4 h-4" /> INPUT LOG</p>
 <p className="text-xs">{data.inputLogId ? <Link href={`/inventory/input-logs/${data.inputLogId}`} className="font-bold text-primary hover:underline">{data.inputLog?.inputNumber}</Link> :"Pending"}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )
}
