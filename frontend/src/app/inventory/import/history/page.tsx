"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Badge } from"@/components/ui/badge"
import { Loader2, History, ArrowLeft } from"lucide-react"
import { useRouter } from"next/navigation"
import { Button } from"@/components/ui/button"

export default function ImportHistoryPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 TimberAPI.getImportHistory().then((res: any) => setData(res.items || [])).catch(console.error).finally(() => setLoading(false))
 }, [])

 return (
 <div className="space-y-6 pb-10">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => router.push("/inventory/import")}><ArrowLeft className="w-4 h-4"/></Button>
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Import History</h1>
 <p className="text-muted-foreground mt-1">Log of past Excel imports.</p>
 </div>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5"/> Import Sessions</CardTitle></CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left">Date</th>
 <th className="p-4 px-6 text-left">File Name</th>
 <th className="p-4 px-6 text-left">Import Type</th>
 <th className="p-4 px-6 text-right">Rows</th>
 <th className="p-4 px-6 text-center">Status</th>
 <th className="p-4 px-6 text-left">User</th>
 </tr>
 </thead>
 <tbody>
 {data.length === 0 ? <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No history</td></tr> :
 data.map(t => (
 <tr key={t.id} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4 px-6">{new Date(t.createdAt).toLocaleString("id-ID")}</td>
 <td className="p-4 px-6 font-medium text-indigo-700">{t.fileName}</td>
 <td className="p-4 px-6">{t.importType}</td>
 <td className="p-4 px-6 text-right font-bold">{t.importedRows} / {t.totalRows}</td>
 <td className="p-4 px-6 text-center"><Badge variant={t.status ==="COMPLETED" ?"default" : (t.status ==="FAILED" ?"destructive" :"secondary")}>{t.status}</Badge></td>
 <td className="p-4 px-6 text-muted-foreground">{t.createdBy}</td>
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
