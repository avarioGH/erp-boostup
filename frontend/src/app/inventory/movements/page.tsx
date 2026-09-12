"use client"
import { useState, useEffect } from"react"
import { api } from"@/lib/api"
import { Card, CardContent } from"@/components/ui/card"
import { Badge } from"@/components/ui/badge"
import { Loader2 } from"lucide-react"

export default function MovementsPage() {
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 api.get('/inventory/timber-movements?take=100')
 .then((res: any) => {
 const items = res.data?.items || res.data || [];
 setData(Array.isArray(items) ? items : []);
 })
 .catch(console.error)
 .finally(() => setLoading(false))
 }, [])

 const getBadgeType = (type: string, refType: string) => {
 if (refType === 'SAWN_OUTPUT') return <Badge className="bg-emerald-500">PRODUCTION</Badge>
 if (refType === 'TRANSFER') return <Badge className="bg-blue-500">TRANSFER</Badge>
 if (refType === 'ADJUSTMENT') return <Badge className="bg-amber-500">ADJUSTMENT</Badge>
 return <Badge variant="outline">{type}</Badge>
 }

 return (
 <div className="space-y-6 pb-10 p-8 dark">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Stock Movements Ledger</h1>
 </div>

 <Card className="shadow-sm bg-[#0f172a] border-border text-white">
 <CardContent className="p-0">
 {loading ? (
 <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="border-b border-border">
 <tr>
 <th className="p-4 px-6 text-left font-bold">Date</th>
 <th className="p-4 px-6 text-left font-bold">Product</th>
 <th className="p-4 px-6 text-left font-bold">Type</th>
 <th className="p-4 px-6 text-center font-bold">In</th>
 <th className="p-4 px-6 text-center font-bold">Out</th>
 <th className="p-4 px-6 text-right font-bold">Balance</th>
 </tr>
 </thead>
 <tbody>
 {data.length === 0 ? (
 <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">No movements found.</td></tr>
 ) : data.map((m, i) => {
 const isIn = m.type === 'IN' || (m.type === 'ADJ' && m.quantityPcs > 0);
 const isOut = m.type === 'OUT' || (m.type === 'ADJ' && m.quantityPcs < 0);
 const qty = Math.abs(m.quantityPcs || m.quantity || 0);
 const productName = m.timberStock?.timberVariant?.sku || m.product?.name || 'Unknown Product';
 const balance = m.timberStock?.currentPcs || 0;

 return (
 <tr key={m.id || i} className="border-b border-border/50 hover:bg-slate-800/20">
 <td className="p-4 px-6 text-slate-300">{new Date(m.date || m.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 font-medium text-slate-200">{productName}</td>
 <td className="p-4 px-6">{getBadgeType(m.type, m.referenceType)}</td>
 <td className="p-4 px-6 text-center text-emerald-400 font-medium">
 {isIn ? qty : '-'}
 </td>
 <td className="p-4 px-6 text-center text-red-400 font-medium">
 {isOut ? qty : '-'}
 </td>
 <td className="p-4 px-6 text-right font-bold text-slate-200">{balance}</td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

