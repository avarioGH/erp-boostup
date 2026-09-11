"use client"
import { useState, useEffect } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Box, Waypoints, CheckCircle2, Factory, Calendar, FileCheck, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function SawnTimberOutputDetailPage({ params }: { params: { id: string } }) {
 const router = useRouter()
 const { toast } = useToast()
 const [data, setData] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState(false)

 const loadData = () => {
 TimberAPI.getSawnOutput(params.id).then(setData).catch(console.error).finally(() => setLoading(false))
 }
 useEffect(() => { loadData() }, [params.id])

 const handleAction = async (action: "post" | "cancel") => {
 setActionLoading(true)
 try {
 if (action === "post") await TimberAPI.postSawnOutput(params.id)
 else await TimberAPI.cancelSawnOutput(params.id)
 toast({ title: "Success", description: `Output ${action === "post" ? "posted" : "cancelled"} successfully.` })
 loadData()
 } catch (err: any) {
 toast({ title: "Error", description: err.response?.data?.message || `Failed to ${action}.`, variant: "destructive" })
 } finally {
 setActionLoading(false)
 }
 }

 if (loading) return <div className="p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
 if (!data) return <div className="p-24 text-center">Output not found.</div>

 return (
 <div className="space-y-6 pb-10">
 <div className="flex items-center justify-between gap-4 border-b pb-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.push('/inventory/sawn-timber/output')}><ArrowLeft className="w-4 h-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold tracking-tight text-indigo-900">{data.bundleNumber}</h1>
 <Badge variant={data.status === "POSTED" ? "default" : (data.status === "DRAFT" ? "secondary" : "destructive")}>{data.status}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Factory className="w-4 h-4" /> Sawn Timber Bundle Output</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {data.status === "DRAFT" && <Button onClick={() => handleAction("post")} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700"><FileCheck className="w-4 h-4 mr-2" /> Post to Stock</Button>}
 {data.status === "POSTED" && <Button onClick={() => handleAction("cancel")} disabled={actionLoading} variant="destructive"><XCircle className="w-4 h-4 mr-2" /> Cancel & Reverse</Button>}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operation</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-y-4">
 <div><p className="text-muted-foreground">Date</p><p className="font-bold flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(data.outputDate).toLocaleDateString("id-ID")}</p></div>
 <div><p className="text-muted-foreground">Shift</p><p className="font-bold">{data.shift || "-"}</p></div>
 <div><p className="text-muted-foreground">Location</p><p className="font-bold">{data.location?.name}</p></div>
 <div><p className="text-muted-foreground">Partai</p><p className="font-bold">{data.batch || "-"}</p></div>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm border-indigo-100">
 <CardHeader className="border-b bg-indigo-50/50 pb-4"><CardTitle className="text-lg flex items-center gap-2 text-indigo-800"><Box className="w-4 h-4" /> Output Summary</CardTitle></CardHeader>
 <CardContent className="pt-6 space-y-4 text-sm">
 <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Pieces</span><span className="font-bold text-lg">{data.items?.reduce((s:number, i:any)=>s+i.quantityPcs, 0)} PCS</span></div>
 <hr className="border-indigo-100" />
 <div className="flex justify-between items-center"><span className="font-bold text-indigo-900">Total Net Volume</span><span className="font-bold text-2xl text-indigo-700">{data.items?.reduce((s:number, i:any)=>s+i.volumeM3, 0).toFixed(6)} M&sup3;</span></div>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg flex items-center gap-2"><Waypoints className="w-4 h-4" /> Traceability</CardTitle></CardHeader>
 <CardContent className="pt-6">
 <div className="flex items-center gap-4 text-sm">
 <div className="p-4 border rounded text-muted-foreground border-dashed">
 <p className="font-medium flex items-center gap-2"><Box className="w-4 h-4" /> INPUT LOG</p>
 <Link href={`/inventory/input-logs/${data.inputLogId}`} className="text-xs font-bold text-indigo-600 hover:underline">{data.inputLog?.inputNumber}</Link>
 </div>
 <div className="h-px bg-border flex-1 mx-2"></div>
 <div className="p-4 border rounded bg-indigo-50 border-indigo-200">
 <p className="font-bold text-indigo-800 flex items-center gap-2"><Factory className="w-4 h-4" /> SAWN BUNDLE</p>
 <p className="text-xs text-muted-foreground">{data.bundleNumber}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="border-b pb-4">
 <CardTitle className="text-lg">Product Details</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="p-3 px-6 text-left">SKU</th>
 <th className="p-3 px-6 text-left">Species</th>
 <th className="p-3 px-6 text-center">Grade</th>
 <th className="p-3 px-6 text-center">Size (T &times; W &times; L)</th>
 <th className="p-3 px-6 text-right">Qty (PCS)</th>
 <th className="p-3 px-6 text-right">M&sup3;</th>
 </tr>
 </thead>
 <tbody>
 {data.items?.map((item: any) => (
 <tr key={item.id} className="border-b hover:bg-muted/10">
 <td className="p-3 px-6 font-medium text-emerald-700">{item.timberVariant?.sku}</td>
 <td className="p-3 px-6">{item.timberVariant?.species}</td>
 <td className="p-3 px-6 text-center">{item.grade}</td>
 <td className="p-3 px-6 text-center">{item.thicknessMm} &times; {item.widthMm} &times; {item.lengthMm}</td>
 <td className="p-3 px-6 text-right font-bold">{item.quantityPcs}</td>
 <td className="p-3 px-6 text-right font-bold text-indigo-700">{item.volumeM3.toFixed(6)}</td>
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
