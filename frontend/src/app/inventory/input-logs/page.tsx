"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Badge } from"@/components/ui/badge"
import { Loader2, Plus, Search, ChevronRight } from"lucide-react"
import { useRouter } from"next/navigation"

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
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Input Logs (WIP)</h1>
 <p className="text-muted-foreground mt-1">Material allocated for sawmill production.</p>
 </div>
 <Button onClick={() => router.push('/inventory/input-logs/create')} className="">
 <Plus className="w-4 h-4 mr-2" /> Create Input Log
 </Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/40">
 <CardTitle className="text-[16px] font-semibold">Input Log Inventory</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search number..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted border-y border-border">
 <tr>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Input Number</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Date</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Partai</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Logs</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Total M?</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Status</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr><td colSpan={7} className="p-14 text-center"><div className="flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-muted-foreground mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="text-sm font-semibold text-foreground mb-1">No records found</p><p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p></div></td></tr> :
 filtered.map(log => (
 <tr key={log.id} className="border-b last:border-0 hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => router.push(`/inventory/input-logs/${log.id}`)}>
 <td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.inputNumber}</td>
 <td className="py-3.5 px-6 text-[13px]">{new Date(log.date).toLocaleDateString("id-ID")}</td>
 <td className="py-3.5 px-6 text-[13px]">{log.batch ||"-"}</td>
 <td className="py-3.5 px-6 text-right text-[13px]">{log.totalQty}</td>
 <td className="py-3.5 px-6 text-right font-bold text-primary text-[13px]">{log.totalVolume}</td>
 <td className="py-3.5 px-6 text-center text-[13px]"><Badge variant={log.status ==="AVAILABLE" ?"default" :"secondary"}>{log.status}</Badge></td>
 <td className="py-3.5 px-6 text-center text-[13px]"><Button variant="ghost" size="sm"><ChevronRight className="w-4 h-4" /></Button></td>
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
