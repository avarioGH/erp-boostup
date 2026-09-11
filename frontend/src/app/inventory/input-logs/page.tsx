"use client"
import { useState, useEffect } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function InputLogsPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")

 useEffect(() => {
 TimberAPI.getInputLogs().then((res: any) => setData(res.items || [])).catch(console.error).finally(() => setLoading(false))
 }, [])

 const filtered = data.filter(item => 
 item.inputNumber?.toLowerCase().includes(search.toLowerCase()) ||
 item.batch?.toLowerCase().includes(search.toLowerCase())
 )

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Input Logs (WIP)</h1>
 <p className="text-muted-foreground mt-1">Material allocated for sawmill production.</p>
 </div>
 <Button onClick={() => router.push('/inventory/input-logs/create')} className="bg-emerald-600 hover:bg-emerald-700">
 <Plus className="w-4 h-4 mr-2" /> Create Input Log
 </Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 flex flex-row items-center justify-between">
 <CardTitle className="text-lg">Input Log Inventory</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search number..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left">Input Number</th>
 <th className="p-4 px-6 text-left">Date</th>
 <th className="p-4 px-6 text-left">Partai</th>
 <th className="p-4 px-6 text-right">Logs</th>
 <th className="p-4 px-6 text-right">Total M?</th>
 <th className="p-4 px-6 text-center">Status</th>
 <th className="p-4 px-6 text-center">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">No records found</td></tr> :
 filtered.map(log => (
 <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/inventory/input-logs/${log.id}`)}>
 <td className="p-4 px-6 font-medium text-emerald-700">{log.inputNumber}</td>
 <td className="p-4 px-6">{new Date(log.date).toLocaleDateString("id-ID")}</td>
 <td className="p-4 px-6">{log.batch || "-"}</td>
 <td className="p-4 px-6 text-right">{log.totalQty}</td>
 <td className="p-4 px-6 text-right font-bold text-indigo-700">{log.totalVolume}</td>
 <td className="p-4 px-6 text-center"><Badge variant={log.status === "AVAILABLE" ? "default" : "secondary"}>{log.status}</Badge></td>
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
