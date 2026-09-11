"use client"
import { useState, useEffect } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Ruler, Box, Waypoints, CheckCircle2, Factory, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RawLogDetailPage({ params }: { params: { id: string } }) {
 const router = useRouter()
 const [data, setData] = useState<any>(null)
 const [trimming, setTrimming] = useState<any>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 Promise.all([
 TimberAPI.getRawLog(params.id),
 TimberAPI.getRawLogTrimming(params.id).catch(() => null)
 ]).then(([logData, trimData]) => {
 setData(logData)
 setTrimming(trimData)
 }).catch(console.error).finally(() => setLoading(false))
 }, [params.id])

 if (loading) return <div className="flex justify-center p-24"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
 if (!data) return <div className="p-24 text-center">Log not found.</div>

 return (
 <div className="space-y-6 pb-10 animate-in fade-in duration-300">
 <div className="flex items-center justify-between gap-4 border-b pb-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.push('/inventory/logs')}><ArrowLeft className="w-4 h-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold tracking-tight text-emerald-800">{data.logNumber}</h1>
 <Badge variant={data.status === "AVAILABLE" ? "default" : "secondary"} className={data.status === "AVAILABLE" ? "bg-emerald-500" : ""}>{data.status}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Box className="w-4 h-4" /> Raw Timber Log ? {data.species}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {data.status === "AVAILABLE" && <Button variant="outline">Edit</Button>}
 <Button variant="outline">Print Barcode</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg flex items-center gap-2"><Ruler className="w-4 h-4" /> Measurements</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-y-4">
 <div><p className="text-muted-foreground">Original Length</p><p className="font-bold">{data.originalLength} m</p></div>
 <div><p className="text-muted-foreground">Class</p><p className="font-bold">{data.diameterClass}</p></div>
 <div><p className="text-muted-foreground">Avg ?</p><p className="font-bold">{data.averageDiameter} cm</p></div>
 <div><p className="text-muted-foreground">Rounded ?</p><p className="font-bold text-lg text-emerald-700">{data.roundedDiameter} cm</p></div>
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
 <div className="flex justify-between items-center"><span className="font-bold text-indigo-900">Net Volume</span><span className="font-bold text-2xl text-indigo-700">{data.netVolume} m?</span></div>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Identity & Location</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div><p className="text-muted-foreground mb-1">Barcode / System ID</p><p className="font-mono bg-muted p-1.5 rounded text-xs">{data.barcode}</p></div>
 <div><p className="text-muted-foreground mb-1">Partai</p><p className="font-medium">{data.batch || "-"}</p></div>
 <div><p className="text-muted-foreground mb-1">Location</p><p className="font-medium text-blue-700">{data.location?.name || "-"}</p></div>
 <div><p className="text-muted-foreground mb-1">Receiving Date</p><p className="font-medium">{new Date(data.receivingDate).toLocaleDateString("id-ID")}</p></div>
 </CardContent>
 </Card>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
 <CardTitle className="text-lg flex items-center gap-2"><Factory className="w-4 h-4" /> Trimming Children</CardTitle>
 <Button size="sm" onClick={() => router.push(`/inventory/logs/${params.id}/trimming/create`)}><Plus className="w-4 h-4 mr-2"/> Add Trimming</Button>
 </CardHeader>
 <CardContent className="pt-6">
 {!trimming || trimming.children.length === 0 ? (
 <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">No trimming records yet.</div>
 ) : (
 <div className="space-y-6">
 <div className="flex gap-8 text-sm">
 <div><p className="text-muted-foreground">Original Length</p><p className="font-bold text-lg">{data.originalLength} m</p></div>
 <div><p className="text-muted-foreground">Allocated</p><p className="font-bold text-lg text-emerald-600">{trimming.allocated} m</p></div>
 <div><p className="text-muted-foreground">Remaining</p><p className="font-bold text-lg text-amber-600">{trimming.remaining} m</p></div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-3 text-left">Trim Code</th>
 <th className="p-3 text-right">Length</th>
 <th className="p-3 text-right">? Avg</th>
 <th className="p-3 text-right">Gross M?</th>
 <th className="p-3 text-right">Net M?</th>
 <th className="p-3 text-center">Status</th>
 </tr>
 </thead>
 <tbody>
 {trimming.children.map((c: any) => (
 <tr key={c.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/inventory/trimming/${c.id}`)}>
 <td className="p-3 font-medium text-emerald-700">{c.trimNumber}</td>
 <td className="p-3 text-right">{c.length} m</td>
 <td className="p-3 text-right">{c.averageDiameter} cm</td>
 <td className="p-3 text-right">{c.grossVolume}</td>
 <td className="p-3 text-right font-bold text-indigo-700">{c.netVolume}</td>
 <td className="p-3 text-center"><Badge variant="secondary">{c.status}</Badge></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
