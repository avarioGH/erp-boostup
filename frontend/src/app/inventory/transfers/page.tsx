"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Badge } from"@/components/ui/badge"
import { Loader2, Plus, Search, ChevronRight, ArrowRightLeft } from"lucide-react"
import { useRouter } from"next/navigation"

export default function TransfersPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")

 useEffect(() => {
 TimberAPI.getTransfers().then((res: any) => setData(res.items || [])).catch(console.error).finally(() => setLoading(false))
 }, [])

 const filtered = data.filter(item => item.transferNumber?.toLowerCase().includes(search.toLowerCase()))

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
 <p className="text-muted-foreground mt-1">Move inventory between locations.</p>
 </div>
 <Button onClick={() => router.push('/inventory/transfers/create')} className="bg-indigo-600 hover:bg-indigo-700">
 <Plus className="w-4 h-4 mr-2" /> Create Transfer
 </Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 flex flex-row items-center justify-between">
 <CardTitle className="text-lg flex items-center gap-2"><ArrowRightLeft className="w-4 h-4"/> Transfer Registry</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search transfer no..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left">Transfer No</th>
 <th className="p-4 px-6 text-left">Date</th>
 <th className="p-4 px-6 text-left">From Location</th>
 <th className="p-4 px-6 text-left">To Location</th>
 <th className="p-4 px-6 text-right">Qty (PCS)</th>
 <th className="p-4 px-6 text-right">Total M?</th>
 <th className="p-4 px-6 text-center">Status</th>
 <th className="p-4 px-6 text-center">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No records found</td></tr> :
 filtered.map(t => (
 <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/inventory/transfers/${t.id}`)}>
 <td className="p-4 px-6 font-medium text-indigo-700">{t.transferNumber}</td>
 <td className="p-4 px-6">{new Date(t.transferDate).toLocaleDateString("id-ID")}</td>
 <td className="p-4 px-6">{t.fromLocation?.name}</td>
 <td className="p-4 px-6">{t.toLocation?.name}</td>
 <td className="p-4 px-6 text-right font-bold">{t.items?.reduce((s:number, i:any)=>s+i.quantityPcs, 0)}</td>
 <td className="p-4 px-6 text-right font-bold text-indigo-700">{t.items?.reduce((s:number, i:any)=>s+i.volumeM3, 0).toFixed(4)}</td>
 <td className="p-4 px-6 text-center"><Badge variant={t.status ==="POSTED" ?"default" : (t.status ==="DRAFT" ?"secondary" :"destructive")}>{t.status}</Badge></td>
 <td className="p-4 px-6 text-center"><Button variant="ghost" size="sm"><ChevronRight className="w-4 h-4" /></Button></td>
 </tr>
 ))
 }
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

