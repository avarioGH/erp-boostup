"use client"
import { useState, useEffect } from "react"
import { TimberAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RawLogsPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")

 useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let locationId = undefined;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('active_warehouse');
        if (stored && stored !== 'null' && stored !== 'undefined') {
          const wh = JSON.parse(stored);
          if (wh?.id) locationId = wh.id;
        }
      }
      const res = await TimberAPI.getRawLogs({ locationId })
      setData(res.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

 const filtered = data.filter(item => 
 item.logNumber?.toLowerCase().includes(search.toLowerCase()) || 
 item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
 item.batch?.toLowerCase().includes(search.toLowerCase())
 )

 const getStatusBadge = (s: string) => {
 switch (s) {
 case 'AVAILABLE': return <Badge className="bg-emerald-500">AVAILABLE</Badge>
 case 'IN_TRIMMING': return <Badge className="bg-amber-500">IN TRIMMING</Badge>
 case 'CANCELLED': return <Badge variant="destructive">CANCELLED</Badge>
 default: return <Badge variant="secondary">{s}</Badge>
 }
 }

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Raw Logs (DUKB)</h1>
 <p className="text-muted-foreground mt-1">Master registry of individual raw timber logs.</p>
 </div>
 <Button onClick={() => router.push('/inventory/logs/create')} className="bg-emerald-600 hover:bg-emerald-700">
 <Plus className="w-4 h-4 mr-2" /> Register Raw Log
 </Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-lg">Log Inventory</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search log no, barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Log No</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Species</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Partai</th>
 <th className="p-4 px-6 text-right font-medium text-muted-foreground">Length</th>
 <th className="p-4 px-6 text-right font-medium text-muted-foreground">Ø Avg</th>
 <th className="p-4 px-6 text-right font-medium text-muted-foreground">Net M³</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No logs found</td></tr> : 
 filtered.map(log => (
 <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/inventory/logs/${log.id}`)}>
 <td className="p-4 px-6 font-medium text-emerald-700">{log.logNumber}</td>
 <td className="p-4 px-6">{log.species}</td>
 <td className="p-4 px-6">{log.batch || '-'}</td>
 <td className="p-4 px-6 text-right">{log.originalLength} m</td>
 <td className="p-4 px-6 text-right">{log.averageDiameter} cm</td>
 <td className="p-4 px-6 text-right font-bold text-indigo-700">{log.netVolume}</td>
 <td className="p-4 px-6 text-center">{getStatusBadge(log.status)}</td>
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
