"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { Loader2, ArrowLeft, ArrowRightLeft, FileCheck, XCircle, MapPin } from"lucide-react"
import { useRouter } from"next/navigation"
import { useToast } from"@/hooks/use-toast"

export default function TransferDetailPage({ params }: { params: { id: string } }) {
 const router = useRouter()
 const { toast } = useToast()
 const [data, setData] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState(false)

 const loadData = () => {
 TimberAPI.getTransfer(params.id).then(setData).catch(console.error).finally(() => setLoading(false))
 }
 useEffect(() => { loadData() }, [params.id])

 const handleAction = async (action:"post" |"cancel") => {
 setActionLoading(true)
 try {
 if (action ==="post") await TimberAPI.postTransfer(params.id)
 else await TimberAPI.cancelTransfer(params.id)
 toast({ title:"Success", description: `Transfer ${action ==="post" ?"posted" :"cancelled"} successfully.` })
 loadData()
 } catch (err: any) {
 toast({ title:"Error", description: err.response?.data?.message || `Failed to ${action}.`, variant:"destructive" })
 } finally {
 setActionLoading(false)
 }
 }

 if (loading) return <div className="p-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
 if (!data) return <div className="p-24 text-center">Transfer not found.</div>

 return (
 <div className="space-y-6 pb-10">
 <div className="flex items-center justify-between gap-4 border-b pb-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.push('/inventory/transfers')}><ArrowLeft className="w-4 h-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold tracking-tight text-indigo-900">{data.transferNumber}</h1>
 <Badge variant={data.status ==="POSTED" ?"default" : (data.status ==="DRAFT" ?"secondary" :"destructive")}>{data.status}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Internal Stock Transfer</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {data.status ==="DRAFT" && <Button onClick={() => handleAction("post")} disabled={actionLoading} className=""><FileCheck className="w-4 h-4 mr-2" /> Post Transfer</Button>}
 {data.status ==="POSTED" && <Button onClick={() => handleAction("cancel")} disabled={actionLoading} variant="destructive"><XCircle className="w-4 h-4 mr-2" /> Cancel & Reverse</Button>}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Card className="shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-[16px] font-semibold">Transfer Route</CardTitle></CardHeader>
 <CardContent className="pt-6">
 <div className="flex items-center justify-between">
 <div className="text-center p-4 border rounded bg-muted/30 flex-1">
 <MapPin className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
 <p className="text-xs text-muted-foreground uppercase font-bold">From Location</p>
 <p className="font-bold mt-1 text-lg">{data.fromLocation?.name}</p>
 </div>
 <div className="px-4"><ArrowRightLeft className="w-6 h-6 text-primary" /></div>
 <div className="text-center p-4 border rounded bg-indigo-50 border-indigo-100 flex-1">
 <MapPin className="w-5 h-5 mx-auto text-primary mb-2" />
 <p className="text-xs text-primary uppercase font-bold">To Location</p>
 <p className="font-bold mt-1 text-lg text-indigo-900">{data.toLocation?.name}</p>
 </div>
 </div>
 <div className="mt-6 pt-4 border-t flex justify-between text-sm">
 <span className="text-muted-foreground">Date: {new Date(data.transferDate).toLocaleDateString("id-ID")}</span>
 <span className="text-muted-foreground">Notes: {data.notes ||"-"}</span>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="border-b pb-4"><CardTitle className="text-[16px] font-semibold">Items Transferred</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-b">
 <tr>
 <th className="p-3 px-6 text-left">SKU</th>
 <th className="p-3 px-6 text-left">Species</th>
 <th className="p-3 px-6 text-center">Grade</th>
 <th className="p-3 px-6 text-right">Qty (PCS)</th>
 <th className="p-3 px-6 text-right">Volume M&sup3;</th>
 </tr>
 </thead>
 <tbody>
 {data.items?.map((item: any) => (
 <tr key={item.id} className="border-b hover:bg-muted/60 transition-colors">
 <td className="p-3 px-6 font-medium text-primary">{item.timberVariant?.sku}</td>
 <td className="p-3 px-6">{item.timberVariant?.species}</td>
 <td className="p-3 px-6 text-center">{item.timberVariant?.grade}</td>
 <td className="p-3 px-6 text-right font-bold">{item.quantityPcs}</td>
 <td className="p-3 px-6 text-right font-bold text-primary">{item.volumeM3.toFixed(6)}</td>
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
